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

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      'Membersihkan metadata PieceInfo...',
      'Menghapus StructTree & Thumbnails...',
      'Mengoptimasi aliran objek...',
      'Memverifikasi integritas TTD Digital...',
      'Menyelesaikan paket data...'
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
                    title="Basic Compression" 
                    desc="Kualitas tajam, ukuran file berkurang sedikit" 
                  />
                  <OptionCard 
                    active={level === 'balanced_50'} 
                    onClick={() => setLevel('balanced_50')}
                    title="Target 50% Reduction" 
                    desc="Keseimbangan terbaik, target ukuran file 50% lebih kecil" 
                  />
                  <OptionCard 
                    active={level === 'ultra_max'} 
                    onClick={() => setLevel('ultra_max')}
                    title="Ultra Max (Target 80%)" 
                    desc="Hasil maksimal, pembersihan struktur terdalam tanpa pecah" 
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[600px] bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center"
            >
              <div className="w-16 h-16 bg-[#D1FAE5] text-[#065F46] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-[#1E293B] mb-2 font-sans">Optimasi Berhasil</h2>
              <p className="text-[#64748B] mb-8 font-medium">Dokumen Anda telah dioptimasi dengan kualitas pixel-perfect.</p>
              
              <div className="flex justify-center items-center gap-12 mb-10">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-[#64748B] mb-1">Before</p>
                  <p className="text-2xl font-bold text-slate-300 line-through">{formatFileSize(result.originalSize)}</p>
                </div>
                <div className="w-[1px] h-12 bg-[#E2E8F0]"></div>
                <div className="bg-[#EFF6FF] px-6 py-4 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-extrabold uppercase text-[#2563EB] mb-1">Optimized</p>
                  <p className="text-3xl font-extrabold text-[#2563EB] leading-none">{formatFileSize(result.compressedSize)}</p>
                  <p className="text-[11px] font-bold text-[#2563EB] mt-2">-{Math.round((1 - result.compressedSize / result.originalSize) * 100)}% Smallere</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleDownload} className="flex-1 h-12 bg-[#2563EB] font-bold hover:bg-[#1D4ED8] rounded-lg">
                  <Download className="w-4 h-4 mr-2" /> Download Document
                </Button>
                <Button variant="outline" onClick={handleReset} className="h-12 px-6 border-[#E2E8F0] font-semibold text-[#1E293B]">
                   <RefreshCcw className="w-4 h-4 mr-2" /> Start New
                </Button>
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

function OptionCard({ active, onClick, title, desc }: { active: boolean, onClick: () => void, title: string, desc: string }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200",
        active ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#E2E8F0] hover:border-[#CBD5E1]"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
        active ? "border-[#2563EB]" : "border-[#CBD5E1]"
      )}>
        {active && <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-[15px] text-[#1E293B]">{title}</div>
        <div className="text-[13px] text-[#64748B]">{desc}</div>
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
