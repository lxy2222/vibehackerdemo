"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function speechRecognitionCtor() {
  if (typeof window === "undefined") {
    return null;
  }
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function joinTranscript(current: string, incoming: string) {
  const next = incoming.trim();
  if (!next) {
    return current;
  }
  if (!current.trim()) {
    return next;
  }
  const needsSpace = !/\s$/.test(current);
  return `${current}${needsSpace ? " " : ""}${next}`;
}

export function VoiceTextarea({
  label,
  value,
  onChange,
  placeholder,
  required,
  minClassName = "min-h-32",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minClassName?: string;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRec | null>(null);
  const wantListenRef = useRef(false);
  const committedRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!wantListenRef.current) {
      committedRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    const Ctor = speechRecognitionCtor();
    setSupported(Boolean(Ctor));
    if (!Ctor) {
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finals = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finals += piece;
        } else {
          interim += piece;
        }
      }
      if (finals) {
        committedRef.current = joinTranscript(committedRef.current, finals);
      }
      onChangeRef.current(joinTranscript(committedRef.current, interim));
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }
      wantListenRef.current = false;
      setListening(false);
      if (event.error === "not-allowed") {
        setError("浏览器没有麦克风权限，请允许后重试。");
        return;
      }
      setError("语音识别中断了，请再试一次。");
    };
    recognition.onend = () => {
      if (wantListenRef.current) {
        try {
          recognition.start();
        } catch {
          wantListenRef.current = false;
          setListening(false);
        }
        return;
      }
      setListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      wantListenRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    };
  }, []);

  function toggleListen() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }
    setError(null);
    if (listening) {
      wantListenRef.current = false;
      recognition.stop();
      setListening(false);
      return;
    }
    committedRef.current = value;
    wantListenRef.current = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      wantListenRef.current = false;
      setError("没法开始录音，请再点一次。");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {supported ? (
          <button
            className={listening ? "btn-primary px-3 py-1.5 text-xs" : "btn-secondary px-3 py-1.5 text-xs"}
            type="button"
            aria-pressed={listening}
            onClick={toggleListen}
          >
            {listening ? "正在听，点此停止" : "语音输入"}
          </button>
        ) : (
          <span className="text-xs text-[var(--olive)]">当前浏览器不支持语音，请打字</span>
        )}
      </div>
      <textarea
        className={`field ${minClassName}`}
        value={value}
        onChange={(event) => {
          committedRef.current = event.target.value;
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        required={required}
        aria-label={label}
      />
      <p className="text-sm text-[var(--olive)]">
        {listening
          ? "正在识别中文语音，说完再点一次停止。也可以边说边改字。"
          : "可以打字，或点「语音输入」口述。"}
      </p>
      {error ? <p className="text-sm text-[var(--cta)]">{error}</p> : null}
    </div>
  );
}
