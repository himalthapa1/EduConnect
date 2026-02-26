import { useState, useRef } from 'react';
import { groupsAPI } from '../utils/api';
import { Icons } from '../ui/icons';

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
      <div className="form-group">
        <label>
          <Icons.file size={16} />
          <span>Title</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter resource title"
          required
          maxLength={200}
        />
      </div>
      <div className="form-group">
        <label>
          <Icons.externalLink size={16} />
          <span>URL (optional)</span>
        </label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </div>
      <div className="form-group">
        <label>
          <Icons.edit size={16} />
          <span>Description (optional)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={3}
          maxLength={1000}
        />
      </div>
      <div className="form-group">
        <label>
          <Icons.filter size={16} />
          <span>Type</span>
        </label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="resource">Resource</option>
          <option value="note">Note</option>
          <option value="file">File</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="link">Link</option>
        </select>
      </div>
      <div
        className={`file-upload ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
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
            <Icons.file size={24} />
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="btn-remove-file"
            >
              <Icons.close size={18} />
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <Icons.upload size={32} />
            <span className="upload-text">Drag & drop a file here</span>
            <span className="upload-subtext">or click to select</span>
          </div>
        )}
      </div>
      <button type="submit" className="btn-submit">
        <Icons.add size={18} />
        <span>Add Resource</span>
      </button>
    </form>
  );
};

export default ResourceForm;
