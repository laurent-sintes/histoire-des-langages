import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { GraphNode, GraphRelation } from '../packages/contracts/runtime.ts';
import { knowledge } from './generated/knowledge.ts';
import './style.css';

const views = ['Référentiel', 'Chronologie', 'Filiations'] as const;
const labels: Record<GraphRelation['kind'], string> = {
  created: 'a créé', influenced: 'a influencé', supports: 'porte', 'contributes-to': 'contribue à',
  'derived-from': 'dérive de', 'inspired-by': 's’inspire de', 'inherits-from': 'hérite de',
  resembles: 'ressemble à', implements: 'implémente', applies: 'applique', succeeds: 'succède à',
  'used-for': 'sert à', addresses: 'répond à',
};
const types = { concept: 'Concept', product: 'Technologie', person: 'Personne', organization: 'Organisation' };
const eventLabels = { release: 'Version', design: 'Conception', publication: 'Publication', standardization: 'Norme', discontinuation: 'Arrêt', attestation: 'Attestation', presentation: 'Présentation' };

function nodeType(node: GraphNode) {
  return node.kind === 'concept' && node.role === 'problem' ? 'Problème à résoudre' : types[node.kind];
}

function Evidence({ record }: { record: Parameters<typeof knowledge.evidence>[0] }) {
  const evidence = knowledge.evidence(record);
  if (!evidence.length) return null;
  return <details>
    <summary>{evidence.length === 1 ? 'Voir la preuve' : `Voir les ${evidence.length} preuves`}</summary>
    <ul className="proofs">
      {evidence.map(({ source, locator, scope }) => <li key={`${source.id}@${source.revision}:${locator}:${scope}`}>
        {source.url ? <a href={source.url}>{source.title}</a> : <strong>{source.title}</strong>}
        <span> · {locator}</span><p>{scope}</p>
      </li>)}
    </ul>
  </details>;
}

function App() {
  const [view, setView] = useState<(typeof views)[number]>('Référentiel');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(knowledge.search('Pascal').find(node => node.id === 'pascal')?.id ?? knowledge.search('')[0]?.id);
  const [selectedTimeline, setSelectedTimeline] = useState(false);
  const current = selected ? knowledge.node(selected) : undefined;
  const results = knowledge.search(query);
  const events = knowledge.timeline(selectedTimeline ? selected : undefined);
  const choose = (node: GraphNode) => setSelected(node.id);

  function relations(rows: readonly GraphRelation[], direction: 'incoming' | 'outgoing') {
    if (!rows.length) return <p className="muted">Aucun lien documenté dans ce sens.</p>;
    return <ul className="entries">{rows.map(edge => {
      const from = knowledge.nodeAt(edge.from);
      const to = knowledge.nodeAt(edge.to);
      const linked = direction === 'incoming' ? from : to;
      if (!linked) return null;
      return <li key={edge.id}>
        <button className="node-link" onClick={() => choose(linked)}>{linked.label}</button>
        <p className="relation-label">{from?.label} <strong>{labels[edge.kind]}</strong> {to?.label}</p>
        <p>{edge.text}</p><Evidence record={edge} />
      </li>;
    })}</ul>;
  }

  return <>
    <header className="hero">
      <div className="frame">
        <a className="skip" href="#content">Aller au contenu</a>
        <p className="eyebrow">Atlas des langages</p>
        <h1>Histoire et filiations des langages</h1>
        <p>Suivre une idée dans le temps, des problèmes qui l’ont fait naître aux technologies qui l’ont reprise.</p>
        <nav aria-label="Vues du graphe">
          {views.map(item => <button key={item} aria-pressed={item === view} onClick={() => setView(item)}>{item}</button>)}
        </nav>
      </div>
    </header>
    <main className="frame workspace" id="content">
      <aside aria-label="Choisir un nœud" className="selector">
        <label htmlFor="search">Acteurs, technologies et problèmes</label>
        <input id="search" type="search" value={query} placeholder="Pascal, JSON, typage…" onChange={event => setQuery(event.target.value)} />
        <p className="muted count" role="status">{results.length} résultat{results.length === 1 ? '' : 's'}</p>
        <ul className="choices">
          {results.map(node => <li key={node.id}>
            <button aria-pressed={node.id === selected} onClick={() => choose(node)}>
              <span>{node.label}</span><small>{nodeType(node)}</small>
            </button>
          </li>)}
        </ul>
      </aside>
      <section className="content" aria-labelledby="section-title">
        {view === 'Référentiel' && <>
          <h2 id="section-title">{current?.label ?? 'Référentiel'}</h2>
          {current && <>
            <p className="eyebrow">{nodeType(current)}</p>
            <Evidence record={current} />
            <ul className="entries">{knowledge.assertions(current.id).map(item => <li key={item.id}>
              <p>{item.text}</p><Evidence record={item} />
            </li>)}</ul>
            <h3>Relations au départ de ce nœud</h3>
            {relations(knowledge.outgoing(current.id), 'outgoing')}
          </>}
        </>}
        {view === 'Chronologie' && <>
          <h2 id="section-title">Chronologie</h2>
          {current && <label className="event-filter">
            <input type="checkbox" checked={selectedTimeline} onChange={event => setSelectedTimeline(event.target.checked)} /> Limiter à {current.label}
          </label>}
          {events.length ? <ol className="entries timeline">{events.map(event => {
            const subject = knowledge.nodeAt(event.subject);
            const date = event.date.start === event.date.end ? event.date.start : `${event.date.start}–${event.date.end}`;
            return <li key={event.id}>
              <span className="year">{event.date.precision === 'approximate' ? 'v. ' : ''}{date}</span>
              <p>{subject && <button className="node-link" onClick={() => choose(subject)}>{subject.label}</button>} · {eventLabels[event.kind]}</p>
              <p>{event.text}</p><Evidence record={event} />
            </li>;
          })}</ol> : <p className="muted">Aucun événement documenté pour ce nœud.</p>}
        </>}
        {view === 'Filiations' && <>
          <h2 id="section-title">{current?.label ?? 'Filiations'}</h2>
          {current && <div className="lineage">
            <section><h3>Liens entrants</h3>{relations(knowledge.incoming(current.id), 'incoming')}</section>
            <section><h3>Liens sortants</h3>{relations(knowledge.outgoing(current.id), 'outgoing')}</section>
          </div>}
        </>}
      </section>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
