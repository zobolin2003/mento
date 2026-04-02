import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, ListOrdered, List, Hash, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  minHeight?: string;
  placeholder?: string;
  onImageUpload?: (url: string) => void;
}

export const RichTextEditor = ({ initialContent, onChange, minHeight = '300px', placeholder, onImageUpload }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  const [savedTags, setSavedTags] = useState<string[]>(() => {
    const tags = localStorage.getItem('mento-journal-tags');
    return tags ? JSON.parse(tags) : ['journal', 'idea', 'todo', 'important'];
  });
  const [activeTagSearch, setActiveTagSearch] = useState<string | null>(null);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [activeTagNode, setActiveTagNode] = useState<HTMLElement | null>(null);

  const filteredTags = activeTagSearch !== null
    ? savedTags.filter(t => t.toLowerCase().includes(activeTagSearch.toLowerCase()) && t !== activeTagSearch)
    : [];

  const checkTagState = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setActiveTagSearch(null);
      return;
    }

    let node = selection.anchorNode;
    let tagNode: HTMLElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName === 'SPAN' && el.dataset.tag === 'true') {
          tagNode = el;
          break;
        }
      }
      node = node.parentNode;
    }

    if (tagNode) {
      const text = tagNode.innerText.replace(/^#/, '').trim();
      setActiveTagSearch(text);
      setActiveTagNode(tagNode);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = editorRef.current?.parentElement?.getBoundingClientRect();
      
      if (containerRect) {
        setSuggestionPos({
          top: rect.bottom - containerRect.top + 8,
          left: rect.left - containerRect.left
        });
      }
    } else {
      setActiveTagSearch(null);
      setActiveTagNode(null);
    }
  };

  const selectTag = (tag: string) => {
    if (activeTagNode) {
      activeTagNode.innerText = `#${tag}`;
      
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(activeTagNode);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      document.execCommand('insertHTML', false, `&nbsp;<span style="color: var(--body); font-weight: 400;">&#8203;</span>`);
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      setActiveTagSearch(null);
      setActiveTagNode(null);
      editorRef.current?.focus();
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = initialContent;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setShowFontDropdown(false);
      }
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setShowSizeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    insertOrderedList: false,
    insertUnorderedList: false,
    fontName: 'Arial',
    fontSize: '3',
  });

  const updateFormats = () => {
    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      fontName: document.queryCommandValue('fontName') || 'Arial',
      fontSize: document.queryCommandValue('fontSize') || '3',
    });
    checkTagState();
  };

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateFormats();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (!isComposing.current && editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkTagState();
    }
  };

  const insertTag = () => {
    const tagHtml = `<span data-tag="true" style="color: var(--color-primary); font-weight: 500;">#</span>`;
    document.execCommand('insertHTML', false, tagHtml);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
    checkTagState();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === '#') {
      e.preventDefault();
      insertTag();
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      let node = selection.anchorNode;
      let tagNode: HTMLElement | null = null;
      
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === 'SPAN' && el.dataset.tag === 'true') {
            tagNode = el;
            break;
          }
        }
        node = node.parentNode;
      }

      if (tagNode) {
        e.preventDefault();

        if (e.key === 'Enter' && filteredTags.length > 0) {
          selectTag(filteredTags[0]);
          return;
        }
        
        const tagText = tagNode.innerText.replace(/^#/, '').trim();
        if (tagText && !savedTags.includes(tagText)) {
          const newTags = [...savedTags, tagText];
          setSavedTags(newTags);
          localStorage.setItem('mento-journal-tags', JSON.stringify(newTags));
        }
        
        // Move cursor to the end of the tag node
        const range = document.createRange();
        range.setStartAfter(tagNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Insert a space outside the tag span, resetting styles
        document.execCommand('insertHTML', false, `&nbsp;<span style="color: var(--body); font-weight: 400;">&#8203;</span>`);
        
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
        setActiveTagSearch(null);
        setActiveTagNode(null);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (onImageUpload) {
        onImageUpload(imageUrl);
      } else {
        // Fallback if no handler provided
        const imgHtml = `<br><img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; max-height: 400px; border-radius: 8px; margin: 8px 0;" /><br>`;
        document.execCommand('insertHTML', false, imgHtml);
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
        editorRef.current?.focus();
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fonts = [
    { name: 'Arial', label: 'Arial' },
    { name: 'Helvetica', label: 'Helvetica' },
    { name: 'Times New Roman', label: 'Times New Roman' },
    { name: 'Microsoft YaHei', label: '微软雅黑' },
    { name: 'SimSun', label: '宋体' },
    { name: 'KaiTi', label: '楷体' },
  ];

  const sizes = [
    { value: '1', label: '12px' },
    { value: '2', label: '14px' },
    { value: '3', label: '16px' },
    { value: '4', label: '18px' },
    { value: '5', label: '24px' },
    { value: '6', label: '32px' },
  ];

  return (
    <div 
      className="flex flex-col border border-[var(--border)] rounded-xl bg-[var(--card)] overflow-hidden h-full shadow-sm cursor-text focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all relative"
      onClick={() => editorRef.current?.focus()}
    >
      {activeTagSearch !== null && filteredTags.length > 0 && (
        <div
          className="absolute z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto min-w-[140px]"
          style={{ top: suggestionPos.top, left: suggestionPos.left }}
        >
          {filteredTags.map(tag => (
            <button
              key={tag}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--background)] text-[var(--body)] transition-colors flex items-center gap-2"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                selectTag(tag);
              }}
            >
              <Hash size={14} className="text-[var(--muted)]" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div 
        className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)] bg-[var(--card)] flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Font Dropdown */}
        <div className="relative" ref={fontDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowFontDropdown(!showFontDropdown);
              setShowSizeDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-[var(--background)] rounded-lg cursor-pointer outline-none text-[var(--body)] transition-colors"
          >
            <span className="truncate max-w-[80px]">
              {fonts.find(f => f.name === formats.fontName.replace(/['"]/g, ''))?.label || 'Arial'}
            </span>
            <ChevronDown size={14} className="text-[var(--muted)]" />
          </button>
          
          <AnimatePresence>
            {showFontDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 w-40 py-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50"
              >
                {fonts.map((font) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => {
                      handleCommand('fontName', font.name);
                      setShowFontDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors",
                      formats.fontName.replace(/['"]/g, '') === font.name ? "text-[var(--color-primary)] font-medium bg-[var(--color-primary)]/5" : "text-[var(--body)]"
                    )}
                    style={{ fontFamily: font.name }}
                  >
                    {font.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Size Dropdown */}
        <div className="relative" ref={sizeDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setShowSizeDropdown(!showSizeDropdown);
              setShowFontDropdown(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-[var(--background)] rounded-lg cursor-pointer outline-none text-[var(--body)] transition-colors"
          >
            <span>
              {sizes.find(s => s.value === formats.fontSize)?.label || '16px'}
            </span>
            <ChevronDown size={14} className="text-[var(--muted)]" />
          </button>
          
          <AnimatePresence>
            {showSizeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 w-24 py-1 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50"
              >
                {sizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => {
                      handleCommand('fontSize', size.value);
                      setShowSizeDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-[var(--background)] transition-colors",
                      formats.fontSize === size.value ? "text-[var(--color-primary)] font-medium bg-[var(--color-primary)]/5" : "text-[var(--body)]"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        <button 
          type="button"
          onClick={() => handleCommand('bold')}
          className={cn("p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--title)] transition-colors", formats.bold && "bg-[var(--background)] text-[var(--title)]")}
          title="加粗"
        ><Bold size={16} /></button>
        <button 
          type="button"
          onClick={() => handleCommand('italic')}
          className={cn("p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--title)] transition-colors", formats.italic && "bg-[var(--background)] text-[var(--title)]")}
          title="斜体"
        ><Italic size={16} /></button>
        <button 
          type="button"
          onClick={() => handleCommand('underline')}
          className={cn("p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--title)] transition-colors", formats.underline && "bg-[var(--background)] text-[var(--title)]")}
          title="下划线"
        ><Underline size={16} /></button>

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        <button 
          type="button"
          onClick={() => handleCommand('insertOrderedList')}
          className={cn("p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--title)] transition-colors", formats.insertOrderedList && "bg-[var(--background)] text-[var(--title)]")}
          title="有序列表"
        ><ListOrdered size={16} /></button>
        <button 
          type="button"
          onClick={() => handleCommand('insertUnorderedList')}
          className={cn("p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--title)] transition-colors", formats.insertUnorderedList && "bg-[var(--background)] text-[var(--title)]")}
          title="无序列表"
        ><List size={16} /></button>

        <div className="w-px h-4 bg-[var(--border)] mx-1" />

        <button 
          type="button"
          onClick={insertTag}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
          title="插入标签"
        >
          <Hash size={16} />
        </button>

        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
          title="插入图片"
        >
          <ImageIcon size={16} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={updateFormats}
        onMouseUp={updateFormats}
        className="flex-1 p-4 outline-none overflow-y-auto prose dark:prose-invert max-w-none focus:ring-0 text-[var(--body)] bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--muted)]"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
};
