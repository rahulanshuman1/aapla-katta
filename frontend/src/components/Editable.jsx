import { createElement } from 'react';
import { useApp } from '../store';
import { CONTENT } from '../defaultContent';

/**
 * Text that the admin can edit in place. For visitors it renders plain text.
 * When the admin turns on "Edit mode", the text becomes click-to-edit and is saved on blur.
 */
export default function Editable({ k, as = 'span', className = '', prefix = '' }) {
  const { text, editMode, saveContent } = useApp();
  const value = text(k);
  const multiline = !!CONTENT[k]?.multiline;

  if (!editMode) return createElement(as, { className }, prefix + value);

  return createElement(
    as,
    {
      className: `${className} editable`,
      contentEditable: true,
      suppressContentEditableWarning: true,
      title: 'Click to edit',
      onClick: (e) => { e.preventDefault(); e.stopPropagation(); },
      onKeyDown: (e) => {
        if (e.key === 'Enter' && !multiline) { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') { e.currentTarget.innerText = value; e.currentTarget.blur(); }
      },
      onBlur: (e) => {
        const v = e.currentTarget.innerText.trim();
        if (v && v !== value) saveContent({ [k]: v });
        else e.currentTarget.innerText = value;
      },
    },
    value
  );
}
