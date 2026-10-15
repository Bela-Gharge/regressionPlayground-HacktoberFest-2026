import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload.find((entry) => entry.payload?.actual !== undefined)?.payload;
  if (!point) return null;

  return (
    <div className="chart-tooltip">
      <strong>{point.x.toFixed(1)} study hours</strong>
      <span>Actual mark <b>{point.actual.toFixed(1)}</b></span>
      <span>Predicted <b>{point.predicted.toFixed(1)}</b></span>
      {point.residual !== undefined && (
        <span>Residual <b>{point.residual.toFixed(2)}</b></span>
      )}
      <span>Decision <b className={point.decision === 'PASS' ? 'tooltip-pass' : 'tooltip-fail'}>{point.decision}</b></span>
      {point.is_outlier && (
        <span style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '4px' }}>
          ⚠️ Outlier (|residual| &gt; 2σ)
        </span>
      )}
    </div>
  );
}

export default function RegressionChart({ data, model, threshold }) {
  // Track theme changes from document root
  const [isDark, setIsDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Dynamic theme-aware colors for Recharts SVG elements
  const gridStroke = isDark ? '#334155' : '#e4ebe5';
  const axisColor = isDark ? '#94a3b8' : '#78877b';
  const refLineColor = isDark ? '#f87171' : '#dd765b';
  const fitLineColor = isDark ? '#4ade80' : '#3e765c';
  const passColor = isDark ? '#4ade80' : '#2f8a68';
  const failColor = isDark ? '#f87171' : '#dd765b';
  const outlierColor = isDark ? '#f87171' : '#dc2626';

  const chartData = useMemo(
    () => model.predictions.map((row) => ({
      ...row,
      decision: row.predicted >= threshold ? 'PASS' : 'FAIL',
    })),
    [model.predictions, threshold],
  );

  const lineData = useMemo(() => {
    const xValues = data.map((point) => point.x);
    const low = Math.min(...xValues);
    const high = Math.max(...xValues);
    return [
      { x: low, fitted: model.intercept + model.slope * low },
      { x: high, fitted: model.intercept + model.slope * high },
    ];
  }, [data, model.intercept, model.slope]);

  const passPoints = useMemo(() => chartData.filter((point) => point.decision === 'PASS'), [chartData]);
  const failPoints = useMemo(() => chartData.filter((point) => point.decision === 'FAIL'), [chartData]);

  return (
    <section className="chart-panel" aria-labelledby="chart-heading">
      <div className="chart-heading-row">
        <div>
          <span className="eyebrow">THE BIG PICTURE</span>
          <h2 id="chart-heading">Study time vs. exam marks</h2>
          <p>Each dot is a student. Color reflects the prediction, with outliers highlighted in red.</p>
        </div>
        <span className="chart-sample-count">{data.length} observations</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 14, right: 20, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={gridStroke} strokeDasharray="3 5" vertical={false} />
            <XAxis
              type="number"
              dataKey="x"
              name="Study hours"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tickLine={false}
              axisLine={{ stroke: axisColor }}
              tick={{ fill: axisColor, fontSize: 12 }}
              label={{ value: 'Study hours', position: 'insideBottom', offset: -2, fill: axisColor, fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="actual"
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
              width={43}
              label={{ value: 'Exam marks', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: axisColor, strokeDasharray: '3 4' }} />
            <Legend verticalAlign="top" align="right" height={34} iconType="circle" wrapperStyle={{ fontSize: 12, color: axisColor }} />
            <ReferenceLine y={threshold} stroke={refLineColor} strokeDasharray="5 5" strokeWidth={1.5} label={{ value: `Decision cutoff ${threshold.toFixed(1)}`, fill: refLineColor, fontSize: 11, position: 'insideTopRight' }} />
            <Line
              data={lineData}
              dataKey="fitted"
              name="Best-fit line"
              type="linear"
              stroke={fitLineColor}
              strokeWidth={3}
              dot={false}
              activeDot={false}
              legendType="line"
            />
            <Scatter data={passPoints} dataKey="actual" name="Predicted PASS" fill={passColor} legendType="circle">
              {passPoints.map((entry, index) => (
                <Cell
                  key={`pass-cell-${index}`}
                  fill={entry.is_outlier ? outlierColor : passColor}
                  stroke={entry.is_outlier ? '#991b1b' : 'none'}
                  strokeWidth={entry.is_outlier ? 2 : 0}
                  r={entry.is_outlier ? 7 : 4}
                />
              ))}
            </Scatter>
            <Scatter data={failPoints} dataKey="actual" name="Predicted FAIL" fill={failColor} legendType="circle">
              {failPoints.map((entry, index) => (
                <Cell
                  key={`fail-cell-${index}`}
                  fill={entry.is_outlier ? outlierColor : failColor}
                  stroke={entry.is_outlier ? '#991b1b' : 'none'}
                  strokeWidth={entry.is_outlier ? 2 : 0}
                  r={entry.is_outlier ? 7 : 4}
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footnote"><span className="threshold-line-key" /> Dashed line = chosen threshold</div>
    </section>
  );
}