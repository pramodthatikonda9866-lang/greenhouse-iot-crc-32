import React, { useState, useCallback, useMemo } from 'react';
import {
  FileCheck2,
  UploadCloud,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  FileX2,
  RefreshCw,
  Copy,
  Check,
  Download,
  Flame,
  ArrowRight,
  Info,
  Binary,
  Layers
} from 'lucide-react';

// IEEE 802.3 CRC-32 Lookup Table for Raw Byte Uint8Array Processing
const createCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
};

const CRC_TABLE = createCrc32Table();

/**
 * Calculates deterministic IEEE 802.3 CRC-32 over raw binary Uint8Array bytes
 * @param {Uint8Array} uint8Array
 * @returns {string} 8-character uppercase hexadecimal checksum
 */
function calculateBufferCrc32(uint8Array) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < uint8Array.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ uint8Array[i]) & 0xFF];
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Format bytes to readable string (e.g. 1.25 MB, 450 KB)
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get first N bytes in hex format
 */
function getHexPreview(uint8Array, maxBytes = 24) {
  const slice = uint8Array.slice(0, maxBytes);
  return Array.from(slice).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export default function FileIntegrityChecker() {
  const [originalFile, setOriginalFile] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  const [expectedCrcInput, setExpectedCrcInput] = useState('');
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedReceived, setCopiedReceived] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process File into raw bytes & calculate CRC-32
  const processFile = useCallback((file, type) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const buffer = e.target.result;
      const uint8 = new Uint8Array(buffer);
      const crc32 = calculateBufferCrc32(uint8);
      const hexPreview = getHexPreview(uint8, 32);

      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: new Date(file.lastModified).toISOString(),
        rawBytes: uint8,
        crc32,
        hexPreview
      };

      if (type === 'original') {
        setOriginalFile(fileInfo);
      } else {
        setReceivedFile(fileInfo);
      }
      setIsProcessing(false);
    };

    reader.onerror = () => {
      alert('Error reading raw file bytes.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  // Drop handlers
  const handleDrop = (e, type) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileInput = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], type);
    }
  };

  // Compare Status
  const comparisonResult = useMemo(() => {
    if (!originalFile && !receivedFile && !expectedCrcInput) return null;

    // Case 1: Both Files Uploaded
    if (originalFile && receivedFile) {
      const isMatch = originalFile.crc32 === receivedFile.crc32;
      return {
        mode: 'DUAL_FILE',
        isMatch,
        verdict: isMatch ? 'FILE INTACT — CRC MATCH' : 'FILE CORRUPTED/MODIFIED — CRC MISMATCH',
        originalCrc: originalFile.crc32,
        receivedCrc: receivedFile.crc32,
        diffNotes: isMatch
          ? 'Every single byte in the received file exactly matches the original file bytes.'
          : `Checksum mismatch (${originalFile.crc32} ≠ ${receivedFile.crc32}). The file content or structure was altered during storage or transit.`
      };
    }

    // Case 2: Original File + Manual Expected CRC
    if (originalFile && expectedCrcInput.trim()) {
      const targetExpected = expectedCrcInput.trim().toUpperCase();
      const isMatch = originalFile.crc32 === targetExpected;
      return {
        mode: 'MANUAL_CRC',
        isMatch,
        verdict: isMatch ? 'FILE INTACT — CRC MATCH' : 'FILE CORRUPTED/MODIFIED — CRC MISMATCH',
        originalCrc: originalFile.crc32,
        receivedCrc: targetExpected,
        diffNotes: isMatch
          ? `The file bytes produced CRC-32 ${originalFile.crc32}, exactly matching the expected hash.`
          : `Calculated CRC-32 (${originalFile.crc32}) does not match the expected hash (${targetExpected}).`
      };
    }

    return null;
  }, [originalFile, receivedFile, expectedCrcInput]);

  // Simulate File Corruption Generator
  const generateCorruptedFile = () => {
    if (!originalFile || !originalFile.rawBytes) return;

    // Create a deep copy of the raw bytes
    const corruptedBytes = new Uint8Array(originalFile.rawBytes);
    
    // Flip a byte near the middle or start
    const targetOffset = Math.max(0, Math.floor(corruptedBytes.length / 2));
    corruptedBytes[targetOffset] = corruptedBytes[targetOffset] ^ 0xFF; // Invert all 8 bits of that byte

    const blob = new Blob([corruptedBytes], { type: originalFile.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrupted_${originalFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Quick Sample Generator for Instant Testing
  const loadQuickSample = () => {
    const textData = "Smart Greenhouse IoT Telemetry Log\nSensor: S025\nTemp: 28.5 C\nHumidity: 72%\nTimestamp: 2026-09-04T14:30:25Z\n";
    const blob = new Blob([textData], { type: 'text/plain' });
    const file = new File([blob], 'greenhouse_sample_telemetry.txt', { type: 'text/plain' });
    processFile(file, 'original');
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'orig') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedReceived(true);
      setTimeout(() => setCopiedReceived(false), 2000);
    }
  };

  const resetAll = () => {
    setOriginalFile(null);
    setReceivedFile(null);
    setExpectedCrcInput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FileCheck2 className="w-7 h-7 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Binary File Integrity Checker</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-medium border border-cyan-500/30">
                Raw Byte CRC-32
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verify firmware, documents, datasets, images, and archives against transmission corruption
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadQuickSample}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            Load Sample File
          </button>

          {(originalFile || receivedFile) && (
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-700 hover:border-rose-500/30 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear Files
            </button>
          )}
        </div>
      </div>

      {/* Comparison Verdict Banner (If Applicable) */}
      {comparisonResult && (
        <div
          className={`p-6 rounded-3xl border shadow-xl transition-all animate-fadeIn ${
            comparisonResult.isMatch
              ? 'bg-gradient-to-r from-emerald-950/50 via-teal-950/30 to-emerald-950/50 border-emerald-500/50 text-emerald-200'
              : 'bg-gradient-to-r from-rose-950/50 via-red-950/30 to-rose-950/50 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                comparisonResult.isMatch ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {comparisonResult.isMatch ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block font-mono ${
                  comparisonResult.isMatch ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  Verification Verdict
                </span>
                <h3 className={`text-2xl font-black font-mono tracking-tight ${
                  comparisonResult.isMatch ? 'text-emerald-300 text-glow-emerald' : 'text-rose-300 text-glow-rose'
                }`}>
                  {comparisonResult.verdict}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  {comparisonResult.diffNotes}
                </p>
              </div>
            </div>

            {/* Checksums Badge */}
            <div className="flex flex-col items-end gap-1.5 font-mono text-xs w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Original CRC:</span>
                <span className="text-emerald-400 font-bold">{comparisonResult.originalCrc}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                comparisonResult.isMatch ? 'bg-slate-900/80 border-slate-800' : 'bg-rose-950/40 border-rose-500/40'
              }`}>
                <span className="text-slate-400">Target CRC:</span>
                <span className={`font-bold ${comparisonResult.isMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {comparisonResult.receivedCrc}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Original File */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="font-bold text-white text-base tracking-tight">1. Original File (Source)</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Reference Byte Stream</span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'original')}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative overflow-hidden group ${
                originalFile
                  ? 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60'
                  : 'border-slate-700/80 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                type="file"
                onChange={(e) => handleFileInput(e, 'original')}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />

              {originalFile ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm truncate max-w-xs mx-auto">{originalFile.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {formatFileSize(originalFile.size)} • {originalFile.type || 'Unknown Type'}
                    </p>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Click or Drop to Replace
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 border border-slate-700 group-hover:border-emerald-500/30 flex items-center justify-center mx-auto transition-all">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Drag & drop original file here</p>
                    <p className="text-xs text-slate-500 mt-0.5">Supports PDF, PNG, JPG, CSV, ZIP, TXT, BIN (any format)</p>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>

            {/* Original File CRC Info */}
            {originalFile && (
              <div className="space-y-3 animate-fadeIn">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Original File CRC-32 Checksum
                    </span>
                    <button
                      onClick={() => copyToClipboard(originalFile.crc32, 'orig')}
                      className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {copiedOriginal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedOriginal ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <span className="text-2xl font-black text-emerald-400 tracking-widest text-glow-emerald">
                      {originalFile.crc32}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      Raw Bytes Verified
                    </span>
                  </div>
                </div>

                {/* Raw Hex Preview */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400 block mb-1">Header Bytes (First 32 bytes):</span>
                  <div className="text-slate-300 select-all overflow-x-auto whitespace-nowrap bg-slate-950 p-2 rounded-lg border border-slate-900">
                    {originalFile.hexPreview}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simulate Mutation Action */}
          {originalFile && (
            <div className="pt-3 border-t border-slate-800/80">
              <button
                onClick={generateCorruptedFile}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-95"
              >
                <Flame className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Download Simulated Corrupted Copy (1-Bit Inversion)</span>
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1.5">
                Mutates 1 byte in the file payload for testing receiver mismatch detection.
              </p>
            </div>
          )}
        </div>

        {/* Box 2: Received File / Verification */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <h3 className="font-bold text-white text-base tracking-tight">2. Received / Target File</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Destination Byte Stream</span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'received')}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative overflow-hidden group ${
                receivedFile
                  ? comparisonResult?.isMatch
                    ? 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60'
                    : 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60'
                  : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                type="file"
                onChange={(e) => handleFileInput(e, 'received')}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />

              {receivedFile ? (
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-md ${
                    comparisonResult?.isMatch
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {comparisonResult?.isMatch ? <FileCheck2 className="w-6 h-6" /> : <FileX2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm truncate max-w-xs mx-auto">{receivedFile.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {formatFileSize(receivedFile.size)} • {receivedFile.type || 'Unknown Type'}
                    </p>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-medium inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    Click or Drop to Replace
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center mx-auto transition-all">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Drag & drop received file here</p>
                    <p className="text-xs text-slate-500 mt-0.5">Compare checksum with original file above</p>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>

            {/* Received File CRC Info */}
            {receivedFile && (
              <div className="space-y-3 animate-fadeIn">
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  comparisonResult?.isMatch ? 'bg-slate-950 border-emerald-500/40' : 'bg-slate-950 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Received File CRC-32 Checksum
                    </span>
                    <button
                      onClick={() => copyToClipboard(receivedFile.crc32, 'recv')}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {copiedReceived ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedReceived ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between font-mono">
                    <span className={`text-2xl font-black tracking-widest ${
                      comparisonResult?.isMatch ? 'text-emerald-400 text-glow-emerald' : 'text-rose-400 text-glow-rose'
                    }`}>
                      {receivedFile.crc32}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      comparisonResult?.isMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {comparisonResult?.isMatch ? 'MATCH' : 'MISMATCH'}
                    </span>
                  </div>
                </div>

                {/* Raw Hex Preview */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400 block mb-1">Header Bytes (First 32 bytes):</span>
                  <div className="text-slate-300 select-all overflow-x-auto whitespace-nowrap bg-slate-950 p-2 rounded-lg border border-slate-900">
                    {receivedFile.hexPreview}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alternative: Enter Expected CRC String Directly */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-xs text-slate-400 font-medium block">
              Or verify against a known expected CRC-32 Hash:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                placeholder="e.g. 8F3A21C7"
                value={expectedCrcInput}
                onChange={(e) => setExpectedCrcInput(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none uppercase"
              />
              {expectedCrcInput && (
                <button
                  onClick={() => setExpectedCrcInput('')}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Technical Knowledge Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Cryptographic & IEEE 802.3 Raw Byte CRC-32 Standards</span>
        </div>
        <p className="leading-relaxed">
          The CRC-32 checksum is calculated deterministically across the <strong>raw binary byte buffer</strong> of the uploaded file using the standard reversed generator polynomial <code className="text-cyan-300 font-mono">0xEDB88320</code>. Any single bit modification, timestamp shift in metadata, or payload tampering results in a completely divergent 32-bit hash, guaranteeing end-to-end file integrity verification.
        </p>
      </div>

    </div>
  );
}
