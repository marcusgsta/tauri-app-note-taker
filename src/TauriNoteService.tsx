import { BaseDirectory, mkdir, readDir, readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { Note } from "./types";

export default class TauriNoteService {
    constructor(private baseDir: BaseDirectory = BaseDirectory.Document) { }

    async initNotes() {
        try {
            await mkdir('note-taker/', {
                baseDir: BaseDirectory.Document,
                recursive: true
            });
        } catch (error) {
            console.log('Notes folder OK or already exists', error);
        }
    }


    async save(note: Note, originalFilename?: string) {
        try {
            const path = `note-taker/${note.title}.txt`;
            // Try rename first if we have an original filename
            if (originalFilename && originalFilename !== note.title) {
                try {
                    await rename(
                        `note-taker/${originalFilename}.txt`,
                        path,
                        {
                            oldPathBaseDir: this.baseDir, newPathBaseDir:
                                this.baseDir
                        }
                    );
                } catch (e) {
                    console.log('No old file to rename, creating new', e)
                }
            }

            await writeTextFile(path, note.content, { baseDir: this.baseDir });
        } catch (error) {
            console.error('Save failed', error)
            throw error;
        }
    }

    async loadAll(): Promise<Note[]> {
        const notesList: Note[] = [];
        try {
            const files = await readDir('note-taker/', {
                baseDir: this.baseDir,
            });

            for (const file of files) {
                if (file.name?.endsWith('.txt') && !file.isDirectory) {
                    try {
                        const content = await readTextFile(`note-taker/${file.name}`, {
                            baseDir: this.baseDir
                        })
                        notesList.push({
                            id: file.name.slice(0, 12),
                            title: file.name.slice(0, -4),
                            content: content,
                        });
                    } catch (error) {
                        console.error(`Could not read ${file.name}:`, error);
                    }
                }
            }
        } catch (error) {
            console.log('No notes or folder missing', error);
        }
        return notesList;
    }
}