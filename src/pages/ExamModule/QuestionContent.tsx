import React from 'react';
import type { ContentBlock, ContentListItem } from '../../exam/types';

function visibleMarker(marker: string) {
  return /^[\uF000-\uF8FF]$/.test(marker) ? '•' : marker;
}

function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  return <>{blocks.filter((block) => !block.hidden).map((block, index) => <Block key={index} block={block} />)}</>;
}

function ListItem({ item }: { item: ContentListItem }) {
  const [first, ...rest] = item.blocks.filter((block) => !block.hidden);
  return (
    <li>
      <span className="qc-marker">{visibleMarker(item.marker)}</span>
      {first?.type === 'paragraph' || first?.type === 'note' ? <span>{first.text}</span> : first && <Block block={first} />}
      {rest.map((block, index) => <Block key={index} block={block} />)}
    </li>
  );
}

function Block({ block }: { block: ContentBlock }) {
  if (block.hidden) return null;
  switch (block.type) {
    case 'heading':
      return block.level <= 2 ? <h3>{block.text}</h3> : <h4>{block.text}</h4>;
    case 'paragraph':
      return <p>{block.text}</p>;
    case 'note':
      return <p className="qc-note">{block.text}</p>;
    case 'options':
      return (
        <div className="qc-options">
          <span className="qc-stem">{block.stem}</span>
          {block.choices.map((choice) => <span className="qc-choice" key={choice}>{choice}</span>)}
        </div>
      );
    case 'list':
      return (
        <ul className={`qc-list ${block.style}`}>
          {block.items.map((item, index) => <ListItem key={`${item.marker}-${index}`} item={item} />)}
        </ul>
      );
    case 'table':
      return (
        <div className="qc-table-wrap">
          <table>
            <thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
            <tbody>{block.rows.map((row) => <tr key={row.join('\u0001')}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export function QuestionContent({ blocks }: { blocks: ContentBlock[] }) {
  return <div className="qc"><Blocks blocks={blocks} /></div>;
}
