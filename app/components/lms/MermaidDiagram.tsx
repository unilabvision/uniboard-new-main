'use client';

import { useEffect, useId, useState } from 'react';

let isMermaidInitialized = false;

interface MermaidDiagramProps {
  chart: string;
}

async function renderMermaidChart(renderId: string, chart: string): Promise<string> {
  const { default: mermaid } = await import('mermaid');
  if (!isMermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'neutral',
      flowchart: { htmlLabels: true, useMaxWidth: true },
    });
    isMermaidInitialized = true;
  }

  const result = await mermaid.render(renderId, chart);
  return result.svg;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId();
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const renderId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    setSvg('');
    setError('');
    void renderMermaidChart(renderId, chart)
      .then((renderedSvg) => {
        if (!isCancelled) setSvg(renderedSvg);
      })
      .catch((renderError) => {
        console.error('[MermaidDiagram]', renderError);
        if (!isCancelled) setError('Flowchart render edilemedi. Mermaid sözdizimini kontrol edin.');
      });
    return () => {
      isCancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <div className="my-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-5 rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
        Flowchart hazırlanıyor…
      </div>
    );
  }

  return (
    <div
      className="my-5 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full dark:border-neutral-700 dark:bg-neutral-950"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
