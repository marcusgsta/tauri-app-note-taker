import { useRef } from "react";

export function OmniBar({
    omniBarValue, 
    editOmniBar, 
    handleKeyDown}: 
    {omniBarValue: string, 
     editOmniBar: (v: string) => void,
     handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    createNoteFromOmniBar: (v: string) => void}) {
  
  const inputRef = useRef<HTMLInputElement>(null);
  
    return (
      
      <input 
        ref={inputRef}
        key="omni-stable" 
        value={omniBarValue}
        onChange={(e) => {
          editOmniBar(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        autoFocus
        className="omni-bar"
        type="text"
        placeholder="Type to search. Open/create with Enter..." />
      
    )
  }