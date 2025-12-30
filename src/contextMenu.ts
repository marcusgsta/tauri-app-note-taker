import { Menu, MenuItemOptions, Submenu } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";
import { Note } from "./types";

export const showContextMenu = async (
  e: React.MouseEvent,
   note: Note,
  focusEditableNoteItem: (id: {id: string}) => void,
  onEditStart: (id: string) => void
) => {
    console.log("🖱️ Context menu triggered for:", note.id);
  e.preventDefault();
  
  const submenu = await Submenu.new({
    text: 'Actions',
    items: [
      {
        id: 'rename',
        text: 'Rename',
        accelerator: 'R',
        action: () => {
            console.log('rename pressed');
            focusEditableNoteItem({id : note.id});
            onEditStart(note.id);
            
          },
      } as MenuItemOptions,
      {
        id: 'delete',
        text: 'Delete',
        accelerator: 'D',
        action: () => {
            console.log('delete pressed');
          },
      } as MenuItemOptions
    ]
  });
  
  const menu = await Menu.new({
    items: [submenu]
  });
  
  await menu.popup(new LogicalPosition(e.clientX, e.clientY));

};
