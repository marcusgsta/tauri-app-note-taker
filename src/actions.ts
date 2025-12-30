import { BaseDirectory, remove } from "@tauri-apps/plugin-fs";

export const deleteNote = async (id: string) => {
    await remove(`note-taker/${id}`, { baseDir: BaseDirectory.Document });
    // Uppdatera notes state
  };
  
  const revealInFinder = async (id: string) => {
    // tauri-plugin-shell: shell.open(path)
  };
  