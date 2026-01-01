import { useState, useRef } from 'react';

const ResourceForm = ({ onSubmit, initial = {} }) => {
  const [title, setTitle] = useState(initial.title || '');
  const [url, setUrl] = useState(initial.url || '');
  const [description, setDescription] = useState(initial.description || '');
  const [type, setType] = useState(initial.type || 'resource');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type === 'file' && !file) {
      alert('Please attach a file for type "File".');
      return;
    }
    onSubmit({
      title: title.trim(),
      url: url.trim() || undefined,
      description: description.trim() || undefined,
      type,
      file
    });
    setTitle('');
    setUrl('');
    setDescription('');
    setType('resource');
    setFile(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      setType('file');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      console.debug('ResourceForm: file selected via dialog', f && { name: f.name, size: f.size, type: f.type });
      setFile(f);
      setType('file');
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form className="resource-form" onSubmit={handleSubmit}>
      <div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title*"
          required
          maxLength={200}
        />
      </div>
      <div>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="URL (optional)"
        />
      </div>
      <div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          maxLength={1000}
        />
      </div>
      <div>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="resource">Resource</option>
          <option value="note">Note</option>
          <option value="file">File</option>
        </select>
      </div>
      <div
        className={`file-upload ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {file ? (
          <div className="file-preview">
            <span>{file.name}</span>
            <button type="button" onClick={removeFile}>Remove</button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <span>Drag & drop a file here, or click to select</span>
          </div>
        )}
      </div>
      <button type="submit">Add</button>
    </form>
  );
};

export default ResourceForm;
