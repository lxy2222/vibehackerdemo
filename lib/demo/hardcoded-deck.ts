import type { DeckSpec, Fact } from "@/lib/presentation/types";

const SOURCE = "fixtures/demo/campaign-data.csv";

export const demoFacts: Fact[] = [
  {
    id: "fact_revenue_q2",
    sourceId: SOURCE,
    label: "Q2 收入",
    value: 864120,
    unit: "元",
    period: "2026-Q2",
    dimensions: {},
    locator: { sheet: "campaign-data", range: "G2:G9" },
    calculation: "sum(revenue where period=Q2)",
  },
  {
    id: "fact_revenue_growth",
    sourceId: SOURCE,
    label: "收入环比",
    value: 25.6,
    unit: "%",
    period: "2026-Q2",
    dimensions: {},
    locator: { sheet: "campaign-data", range: "G2:G9" },
    calculation: "(Q2-Q1)/Q1",
  },
  {
    id: "fact_conversion_q2",
    sourceId: SOURCE,
    label: "Q2 转化率",
    value: 5.3,
    unit: "%",
    period: "2026-Q2",
    dimensions: {},
    locator: { sheet: "campaign-data", range: "E2:F9" },
    calculation: "orders/visits",
  },
  {
    id: "fact_conversion_growth",
    sourceId: SOURCE,
    label: "转化率环比",
    value: 16.2,
    unit: "%",
    period: "2026-Q2",
    dimensions: {},
    locator: { sheet: "campaign-data", range: "E2:F9" },
    calculation: "(Q2-Q1)/Q1",
  },
  {
    id: "fact_cost_q2",
    sourceId: SOURCE,
    label: "Q2 投放成本",
    value: 400500,
    unit: "元",
    period: "2026-Q2",
    dimensions: {},
    locator: { sheet: "campaign-data", range: "H2:H9" },
    calculation: "sum(cost where period=Q2)",
  },
  {
    id: "fact_unsub_growth",
    sourceId: SOURCE,
    label: "退订环比",
    value: 78.9,
    unit: "%",
    period: "2026-Q2",
    dimensions: {},
    locator: { sheet: "campaign-data", range: "I2:I9" },
    calculation: "(Q2-Q1)/Q1",
  },
  {
    id: "fact_rev_feed_q1",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 273000,
    unit: "元",
    period: "2026-Q1",
    dimensions: { channel: "信息流" },
    locator: { sheet: "campaign-data", range: "G2" },
  },
  {
    id: "fact_rev_brand_q1",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 144000,
    unit: "元",
    period: "2026-Q1",
    dimensions: { channel: "品牌广告" },
    locator: { sheet: "campaign-data", range: "G3" },
  },
  {
    id: "fact_rev_private_q1",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 194400,
    unit: "元",
    period: "2026-Q1",
    dimensions: { channel: "私域" },
    locator: { sheet: "campaign-data", range: "G4" },
  },
  {
    id: "fact_rev_content_q1",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 76800,
    unit: "元",
    period: "2026-Q1",
    dimensions: { channel: "内容种草" },
    locator: { sheet: "campaign-data", range: "G5" },
  },
  {
    id: "fact_rev_feed_q2",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 462720,
    unit: "元",
    period: "2026-Q2",
    dimensions: { channel: "信息流" },
    locator: { sheet: "campaign-data", range: "G6" },
  },
  {
    id: "fact_rev_brand_q2",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 148500,
    unit: "元",
    period: "2026-Q2",
    dimensions: { channel: "品牌广告" },
    locator: { sheet: "campaign-data", range: "G7" },
  },
  {
    id: "fact_rev_private_q2",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 201300,
    unit: "元",
    period: "2026-Q2",
    dimensions: { channel: "私域" },
    locator: { sheet: "campaign-data", range: "G8" },
  },
  {
    id: "fact_rev_content_q2",
    sourceId: SOURCE,
    label: "渠道收入",
    value: 51600,
    unit: "元",
    period: "2026-Q2",
    dimensions: { channel: "内容种草" },
    locator: { sheet: "campaign-data", range: "G9" },
  },
  {
    id: "fact_conv_feed_q2",
    sourceId: SOURCE,
    label: "渠道转化率",
    value: 6.0,
    unit: "%",
    period: "2026-Q2",
    dimensions: { channel: "信息流" },
    locator: { sheet: "campaign-data", range: "E6:F6" },
    calculation: "orders/visits",
  },
  {
    id: "fact_conv_brand_q2",
    sourceId: SOURCE,
    label: "渠道转化率",
    value: 3.0,
    unit: "%",
    period: "2026-Q2",
    dimensions: { channel: "品牌广告" },
    locator: { sheet: "campaign-data", range: "E7:F7" },
    calculation: "orders/visits",
  },
  {
    id: "fact_conv_private_q2",
    sourceId: SOURCE,
    label: "渠道转化率",
    value: 11.0,
    unit: "%",
    period: "2026-Q2",
    dimensions: { channel: "私域" },
    locator: { sheet: "campaign-data", range: "E8:F8" },
    calculation: "orders/visits",
  },
  {
    id: "fact_conv_content_q2",
    sourceId: SOURCE,
    label: "渠道转化率",
    value: 2.0,
    unit: "%",
    period: "2026-Q2",
    dimensions: { channel: "内容种草" },
    locator: { sheet: "campaign-data", range: "E9:F9" },
    calculation: "orders/visits",
  },
];

const notesSource = "会议纪要：Q2 活动复盘会";

export function getDemoDeck(emptyDataSlides: boolean): {
  spec: DeckSpec;
  facts: Fact[];
} {
  const facts = emptyDataSlides ? [] : demoFacts;
  const dataRefs = emptyDataSlides
    ? []
    : [
        "fact_revenue_q2",
        "fact_revenue_growth",
        "fact_conversion_q2",
        "fact_conversion_growth",
      ];

  const spec: DeckSpec = {
    title: "Q2 活动复盘",
    subtitle: "管理层周会 · 10 分钟",
    slides: [
      {
        id: "s1",
        type: "cover",
        headline: "Q2 活动复盘",
        takeaway: "能交卷，但还没打赢",
        bullets: ["汇报对象：公司管理层周会", "时长：10 分钟", "口径：与 Q1 环比"],
        factRefs: [],
        speakerNotes: "",
        estimatedSeconds: 20,
      },
      {
        id: "s2",
        type: "executive_summary",
        headline: "核心结论",
        takeaway: emptyDataSlides
          ? "整体能交卷，但质量和结构问题需要当场拍板"
          : "收入环比 {{fact_revenue_growth}}，转化率同步改善；退订上升，品牌投放几乎不增长",
        bullets: emptyDataSlides
          ? [
              "材料中缺少业务数据表，本页仅基于会议纪要",
              "信息流被会上认为是主要增量来源，但客诉风险也被点名",
              "是否把预算从品牌挪到信息流，会上尚未决定",
            ]
          : [
              "增长主要来自信息流，品牌广告收入几乎持平",
              "退订环比 {{fact_unsub_growth}}，质量指标还没进管理层口径",
              "需要当场拍板：要不要把部分品牌预算挪到信息流",
            ],
        factRefs: dataRefs,
        speakerNotes:
          "先给结论：不是报流水账。一句话是增长有，但质量在恶化，预算结构要调。接下来用三页数据撑住这句话，再讲原因和建议。",
        estimatedSeconds: 70,
      },
      {
        id: "s3",
        type: "kpi_overview",
        headline: "关键指标总览",
        takeaway: emptyDataSlides
          ? "本页需要业务数据表"
          : "收入和转化都在改善，成本上升更慢，但退订明显变差",
        bullets: [],
        factRefs: emptyDataSlides
          ? []
          : [
              "fact_revenue_q2",
              "fact_revenue_growth",
              "fact_conversion_q2",
              "fact_conversion_growth",
              "fact_cost_q2",
              "fact_unsub_growth",
            ],
        speakerNotes:
          "四个数只讲对比：收入和转化是亮点，成本可控，退订是必须被问到的点。不要在这页展开渠道。",
        estimatedSeconds: 50,
      },
      {
        id: "s4",
        type: "trend",
        headline: "渠道收入趋势",
        takeaway: emptyDataSlides
          ? "缺少分渠道时间序列"
          : "信息流是唯一明显拉升的渠道，种草在下降",
        bullets: [],
        factRefs: emptyDataSlides
          ? []
          : [
              "fact_rev_feed_q1",
              "fact_rev_feed_q2",
              "fact_rev_brand_q1",
              "fact_rev_brand_q2",
              "fact_rev_private_q1",
              "fact_rev_private_q2",
              "fact_rev_content_q1",
              "fact_rev_content_q2",
            ],
        chart: {
          type: "line",
          factRefs: emptyDataSlides
            ? []
            : [
                "fact_rev_feed_q1",
                "fact_rev_feed_q2",
                "fact_rev_brand_q1",
                "fact_rev_brand_q2",
                "fact_rev_private_q1",
                "fact_rev_private_q2",
                "fact_rev_content_q1",
                "fact_rev_content_q2",
              ],
        },
        speakerNotes:
          "让领导看斜率：信息流向上，品牌几乎平，种草向下。这页用来支持后面挪预算的建议。",
        estimatedSeconds: 55,
      },
      {
        id: "s5",
        type: "comparison",
        headline: "Q2 渠道转化对比",
        takeaway: emptyDataSlides
          ? "缺少渠道转化数据"
          : "私域转化最高，信息流规模和转化都可用，种草最弱",
        bullets: [],
        factRefs: emptyDataSlides
          ? []
          : [
              "fact_conv_feed_q2",
              "fact_conv_brand_q2",
              "fact_conv_private_q2",
              "fact_conv_content_q2",
            ],
        chart: {
          type: "bar_horizontal",
          factRefs: emptyDataSlides
            ? []
            : [
                "fact_conv_feed_q2",
                "fact_conv_brand_q2",
                "fact_conv_private_q2",
                "fact_conv_content_q2",
              ],
        },
        speakerNotes:
          "对比只讲结构：私域效率最高但依赖值班；信息流能规模化；种草这一季不该加预算。",
        estimatedSeconds: 50,
      },
      {
        id: "s6",
        type: "diagnosis",
        headline: "问题与原因",
        takeaway: "增长来得不稳，质量和供给都有缺口",
        bullets: [
          "同一套主视觉连用 8 周，后两周点击率明显下降",
          "私域周末无值班，转化会断档，方案还没定",
          "6 月竞品加补贴，部分渠道获客成本被抬高，原因未拆完",
        ],
        factRefs: [],
        speakerNotes:
          "这三句话都来自纪要，不是猜的。被追问时回到纪要里的周敏、陈飞、王倩原话。数字页已经讲完，这里讲为什么。",
        estimatedSeconds: 70,
      },
      {
        id: "s7",
        type: "recommendations",
        headline: "下一阶段建议",
        takeaway: "把预算转向有效渠道，并把质量指标放进汇报口径",
        bullets: [
          "从品牌广告挪出一部分预算到信息流，品牌保留基础曝光",
          "私域补周末值班，避免转化断档",
          "管理层口径增加退订率和客诉，避免只看成交",
        ],
        factRefs: [],
        speakerNotes:
          "建议要可执行。挪预算是今天想让领导拍的板；值班和质量指标是为了挡住退订这个雷。",
        estimatedSeconds: 65,
      },
      {
        id: "s8",
        type: "action_plan",
        headline: "行动计划",
        takeaway: "下周一前给出可执行的预算和质量方案",
        bullets: [
          "汇总复盘结论与待拍板事项｜李然｜下周一",
          "给出品牌预算挪移比例建议｜陈飞｜下周一",
          "提交周末值班与质量指标口径｜周敏 / 王倩｜下周一",
        ],
        factRefs: [],
        speakerNotes:
          "收尾只留三件事和一个人总负责。如果领导只记一句话：下周一前要看到预算挪移比例。",
        estimatedSeconds: 40,
      },
    ],
  };

  spec.slides.forEach((slide) => {
    if (slide.type !== "cover" && !slide.speakerNotes.includes(notesSource)) {
      slide.speakerNotes = `${slide.speakerNotes}\n\n来源：${notesSource}${
        emptyDataSlides ? "" : "；数据：campaign-data.csv"
      }`;
    }
  });

  return { spec, facts };
}
