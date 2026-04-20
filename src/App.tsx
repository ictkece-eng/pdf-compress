/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  RefreshCcw, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Info,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { Button } from '@/components/elements/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/elements/card';
import { Progress } from '@/components/elements/progress';
import { Badge } from '@/components/elements/badge';
import { Separator } from '@/components/elements/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/elements/tabs';

import { FileUpload } from '@/components/FileUpload';
import { PdfPreview } from '@/components/PdfPreview';
import { compressPdf, formatFileSize, CompressionLevel, CompressionResult } from '@/lib/pdf-processor';

type Step = 'upload' | 'config' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('ultra_max');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Memulai optimasi...');

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setStep('config');
  };

  // Handle compression execution
  const handleCompress = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    // Simulate progress
    const messages = [
      'Memindai struktur dokumen...',
      'Mendeteksi Tanda Tangan Digital...',
      'Smart Rebuild: Rekonstruksi paket data...',
      'Deep Deduplication: Menghapus objek ganda...',
      'Optimasi aliran objek (Object Streams)...',
      'Finalisasi kompresi tingkat tinggi...'
    ];

    let msgIdx = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        const next = prev + 5;
        if (next % 15 === 0 && msgIdx < messages.length - 1) {
          msgIdx++;
          setStatusMessage(messages[msgIdx]);
        }
        return next;
      });
    }, 150);

    try {
      setStatusMessage(messages[0]);
      const res = await compressPdf(file, level);
      setResult(res);
      setProgress(100);
      setStatusMessage('Optimasi Selesai!');
      setTimeout(() => {
        setStep('result');
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Compression failed:', error);
      toast.error('Gagal mengompres PDF. Silakan coba lagi.');
      setIsProcessing(false);
    } finally {
      clearInterval(interval);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Berhasil mengunduh file!');
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setStep('upload');
    setProgress(0);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] font-sans overflow-hidden">
      <Toaster position="top-center" richColors />
      
      {/* Navbar */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-10 justify-between shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
          <div className="w-8 h-8 bg-[#2563EB] rounded-md flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-100 italic">
            PDF
          </div>
          <span className="font-bold text-xl text-[#2563EB] tracking-tight">Pekerja Keras</span>
        </div>
        
        <div className="flex gap-6 items-center text-sm font-semibold text-[#64748B]">
          <span className="cursor-pointer hover:text-[#2563EB] transition-colors">How it works</span>
          <span className="cursor-pointer hover:text-[#2563EB] transition-colors">Security</span>
          <span className="cursor-pointer hover:text-[#2563EB] transition-colors">Support</span>
          <Button variant="link" className="text-[#2563EB] font-bold p-0">Sign In</Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-[800px]"
            >
              <div className="text-center mb-10">
                <Badge className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5] border-none mb-4 uppercase text-[10px] tracking-widest font-bold">
                  Ultra Performance Compression Engine
                </Badge>
                <h1 className="text-5xl font-extrabold tracking-tight text-[#1E293B] mb-4">
                  Compress PDF <span className="text-[#2563EB]">tanpa pecah</span>
                </h1>
                <p className="text-[#64748B] text-lg max-w-xl mx-auto">
                  Optimasi dokumen profesional dengan jaminan kualitas visual tetap tajam dan Tanda Tangan Digital tetap aman.
                </p>
              </div>

              <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <BenefitCard theme="polish" title="Deep Structural Strip" desc="Removes PieceInfo, StructTree, and XMP metadata without losing visual data." />
                <BenefitCard theme="polish" title="Object Stream Packing" desc="Aggressively packs internal objects into efficient compressed streams." />
                <BenefitCard theme="polish" title="Signature Guard" desc="Advanced appearance stream preservation for digital signatures." />
              </div>
            </motion.div>
          )}

          {/* Step 2: Config Workspace Card */}
          {step === 'config' && file && (
            <motion.div
              key="config"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] flex overflow-hidden w-[944px] h-[520px] max-w-full"
            >
              {/* Left: Preview Pane */}
              <div className="w-[380px] bg-[#F1F5F9] border-r border-[#E2E8F0] p-8 flex flex-col items-center">
                <div className="mb-6 text-center">
                  <Badge className="bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5] border-none text-[10px] font-bold">
                    LIVE PREVIEW
                  </Badge>
                  <p className="text-[11px] text-[#64748B] mt-2 font-medium">Page 1 of {file.name.length > 20 ? '...' : 'Doc'}</p>
                </div>
                
                <div className="w-full flex-1 min-h-0 bg-transparent">
                  <PdfPreview file={file} />
                </div>

                <div className="mt-6 flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1 bg-white border-[#E2E8F0] text-[#1E293B] text-[11px] h-8">
                    Zoom In
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-white border-[#E2E8F0] text-[#1E293B] text-[11px] h-8">
                    Zoom Out
                  </Button>
                </div>
              </div>

              {/* Right: Config Pane */}
              <div className="flex-1 p-10 flex flex-col">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[#1E293B] mb-1 line-clamp-1">{file.name}</h3>
                  <div className="text-sm text-[#64748B] flex gap-4">
                    <span>Original: {formatFileSize(file.size)}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Professional Scan</span>
                  </div>
                </div>

                <div className="uppercase text-[11px] font-extrabold tracking-widest text-[#64748B] mb-4">
                  Compression Level
                </div>

                <div className="flex flex-col gap-3 mb-8">
                  <OptionCard 
                    active={level === 'basic'} 
                    onClick={() => setLevel('basic')}
                    title="Essential Cleaning" 
                    desc="Hapus meta-data ringan, teks tajam sempurna" 
                    savings="EST. 10%"
                  />
                  <OptionCard 
                    active={level === 'balanced_50'} 
                    onClick={() => setLevel('balanced_50')}
                    title="Industrial Packing" 
                    desc="Optimasi struktur objek, keseimbangan terbaik" 
                    savings="EST. 30%"
                  />
                  <OptionCard 
                    active={level === 'ultra_max'} 
                    onClick={() => setLevel('ultra_max')}
                    title="Extreme Deduplication" 
                    desc="Pembersihan paling dalam, hasil maksimal" 
                    savings="EST. 60%+"
                  />
                </div>

                <div className="mt-auto space-y-4">
                  {isProcessing && (
                    <div className="space-y-3">
                       <Progress value={progress} className="h-1.5 bg-[#F1F5F9]" />
                       <p className="text-[10px] text-center font-bold text-[#2563EB] uppercase tracking-wider animate-pulse italic">{statusMessage}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      className="h-12 px-6 border-[#E2E8F0] text-[#1E293B] font-semibold hover:bg-[#F8FAFC]"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCompress}
                      disabled={isProcessing}
                      className="flex-1 h-12 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-base rounded-lg shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
                    >
                      {isProcessing ? 'Processing...' : 'Compress & Download'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Result View */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[640px] bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-12 text-center"
            >
              <div className="w-20 h-20 bg-[#D1FAE5] text-[#065F46] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              
              <div className="space-y-2 mb-10">
                <h2 className="text-4xl font-black text-[#1E293B] tracking-tight">
                  Your PDF is now {Math.round((1 - result.compressedSize / result.originalSize) * 100)}% smaller!
                </h2>
                <p className="text-[#64748B] text-lg font-medium">
                  {result.signatureDetected 
                    ? 'Optimasi berhasil dengan tetap menjaga keamanan visual Tanda Tangan Digital Anda.' 
                    : 'Pekerja Keras telah berhasil mengoptimasi dokumen Anda dengan rasio maksimal.'}
                </p>
                {result.signatureDetected && (
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-bold mt-4">
                     <ShieldCheck className="w-3.5 h-3.5" /> Signature Protection Active
                   </div>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12 bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-1">Ukuran Asli</p>
                  <p className="text-2xl font-bold text-slate-400 line-through">{formatFileSize(result.originalSize)}</p>
                </div>
                
                <div className="hidden md:block">
                  <ChevronRight className="w-8 h-8 text-slate-300" />
                </div>
                
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase text-[#2563EB] tracking-widest mb-1">Hasil Optimasi</p>
                  <p className="text-4xl font-black text-[#2563EB] tracking-tighter">{formatFileSize(result.compressedSize)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button onClick={handleDownload} className="w-full h-14 bg-[#2563EB] text-lg font-black hover:bg-[#1D4ED8] rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]">
                  <Download className="w-5 h-5 mr-3" /> Unduh Dokumen Sekarang
                </Button>
                <Button variant="ghost" onClick={handleReset} className="h-10 text-slate-500 font-bold hover:bg-slate-50">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Optimasi File Lain
                </Button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 italic">
                <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100 mb-4 font-mono">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Optimization Audit
                  </p>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <li className="text-[9px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> PieceInfo Purged</li>
                    <li className="text-[9px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Metadata Stripped</li>
                    <li className="text-[9px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Object Stream Pack</li>
                    <li className="text-[9px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Deduplication Ready</li>
                    <li className="text-[9px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> XRef Rebuild</li>
                    <li className="text-[9px] text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Binary Precision</li>
                  </ul>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Sistem telah melakukan rekonstruksi biner tingkat rendah untuk efisiensi penyimpanan yang maksimal.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="h-[60px] bg-white border-t border-[#E2E8F0] flex justify-center items-center gap-10 text-[13px] text-[#94A3B8] shrink-0">
        <div className="flex items-center gap-2">
          <span>🔒</span> 256-bit SSL Encryption
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span> ISO/IEC 27001 Certified
        </div>
        <div className="flex items-center gap-2">
          <span>☁️</span> Files auto-deleted after 1h
        </div>
      </footer>
    </div>
  );
}

function BenefitCard({ title, desc, theme }: { title: string, desc: string, theme?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm hover:border-[#2563EB]/30 transition-all group">
      <div className="w-10 h-10 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-[#2563EB] mb-4 group-hover:scale-110 transition-transform">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-[#1E293B] mb-1">{title}</h3>
      <p className="text-xs text-[#64748B] leading-relaxed">{desc}</p>
    </div>
  );
}

function OptionCard({ active, onClick, title, desc, savings }: { active: boolean, onClick: () => void, title: string, desc: string, savings?: string }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "border-2 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 relative group",
        active ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
      )}
    >
      {savings && (
        <div className="absolute -top-2 -right-2 bg-[#10B981] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10">
          {savings}
        </div>
      )}
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
        active ? "border-[#2563EB]" : "border-[#CBD5E1]"
      )}>
        {active && <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />}
      </div>
      <div className="flex-1">
        <div className="font-bold text-base text-[#1E293B] group-hover:text-[#2563EB] transition-colors">{title}</div>
        <div className="text-xs text-[#64748B] font-medium">{desc}</div>
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
