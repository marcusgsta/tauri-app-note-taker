import { useCallback, useRef } from "react";
import { Note } from "./types";


export function CurrentNote({ currentNote, 
  setCurrentNote, 
  updateNoteContent, 
  openNoteByTitle }:
  {
    currentNote: Note,
    setCurrentNote: any,
    updateNoteContent: any,
    openNoteByTitle: (title: string) => void,
  }) {
    const content = currentNote?.content ?? "";

    const renderWithWikiLinks = (text: string) => {
      const parts = text.split(/(\[\[[^\]]+\]\])/g)
      return parts.map((part, i) => {
        const match = part.match(/^\[\[([^\]]+)\]\]$/);
        if (!match) return <span key={i}>{part}</span>;
        const title = match[1];
        return (
          <span 
            key={i}
            className="wikilink"
            onMouseDown={(e) => {
              e.preventDefault();
              openNoteByTitle(title);
            }}
          >
            {`[[${title}]]`}
          </span>
        );
      });
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleScroll = useCallback(() => {
      if (textareaRef.current) {
        const mirror = textareaRef.current.parentElement?.querySelector('.note-mirror');
        if (mirror) {
          mirror.scrollTop = textareaRef.current.scrollTop;
          mirror.scrollLeft = textareaRef.current.scrollLeft;
        }
      }
    }, []);

  return (
    <div className="note-container">
      <div className="note-mirror">
        {renderWithWikiLinks(content)}
      </div>

      <textarea
      ref={textareaRef}
        className="note-textarea"
        value={content}
        onChange={(e) => {
          const newContent = e.target.value;
          if (currentNote) {
            updateNoteContent(currentNote.id, currentNote.title, newContent); // autosave
            setCurrentNote((prev: Note) => 
              prev ? { ...prev, content: e.target.value } : null
            );
          }
        }}
        onScroll={handleScroll}
      />
    </div>
  );
}
