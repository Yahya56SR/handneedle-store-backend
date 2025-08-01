// src/components/tiptap-editor.tsx
"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Heading from "@tiptap/extension-heading";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  ListOrdered,
  List,
  Quote,
  Minus,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImageIcon,
} from "lucide-react";

const TipTapEditorWrapper = dynamic(
  () => Promise.resolve(TipTapEditorComponent),
  {
    ssr: false,
    loading: () => <p>Chargement de {"l'éditeur.."}.</p>,
  }
);

interface TipTapEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50 rounded-t-md">
      {/* Boutons de formatage de base */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${
          editor.isActive("bold") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Gras"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${
          editor.isActive("italic") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Italique"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded ${
          editor.isActive("underline") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Souligner"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded ${
          editor.isActive("strike") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Barré"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1 rounded ${
          editor.isActive("highlight") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Surligner"
      >
        <Highlighter className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1 rounded ${
          editor.isActive("code") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </button>

      {/* Boutons pour les titres */}
      <span className="w-[1px] h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 rounded ${
          editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 rounded ${
          editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1 rounded ${
          editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>

      {/* Boutons de listes et de blocs */}
      <span className="w-[1px] h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${
          editor.isActive("bulletList") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Liste à puces"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${
          editor.isActive("orderedList") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1 rounded ${
          editor.isActive("blockquote") ? "bg-gray-200" : ""
        } cursor-pointer`}
        title="Citation"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-1 rounded cursor-pointer"
        title="Ligne horizontale"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Boutons pour les tables */}
      <span className="w-[1px] h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        className="p-1 rounded cursor-pointer"
        title="Insérer un tableau"
      >
        <TableIcon className="h-4 w-4" />
      </button>

      {/* Boutons pour les images et les liens */}
      <span className="w-[1px] h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL de l'image");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className="p-1 rounded cursor-pointer"
        title="Insérer une image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL du lien");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className="p-1 rounded cursor-pointer"
        title="Insérer un lien"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

const TipTapEditorComponent: React.FC<TipTapEditorProps> = ({
  id,
  value,
  onChange,
  placeholder,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-gray-300 pl-4 italic my-2",
          },
        },
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Commencez à écrire ici...",
      }),
      Heading,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      ImageExtension,
      Link.configure({
        openOnClick: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        ...(id && { id: id }),
        // Utilisation de notre classe CSS personnalisée 'tiptap-content'
        class:
          "tiptap-content min-h-[200px] max-h-[400px] overflow-y-auto w-full p-4 border-x border-b border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500",
      },
    },
  });

  useEffect(() => {
    const isSame = editor?.getHTML() === value;
    if (editor && !isSame) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="border border-gray-300 rounded-md">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditorWrapper;
