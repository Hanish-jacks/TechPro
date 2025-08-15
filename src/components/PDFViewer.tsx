import React, { useState, useRef } from 'react';
import { FileText, Download, Eye, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  pdfUrl: string;
  filename?: string;
  fileSize?: number;
  pageCount?: number;
  className?: string;
  showPreview?: boolean;
  onDownload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  filename,
  fileSize,
  pageCount,
  className,
  showPreview = false,
  onDownload,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsLoading(true);
    setHasError(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPage(1);
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = filename || 'document.pdf';
      link.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const nextPage = () => {
    if (pageCount && currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => setScale(Math.min(scale + 0.2, 3));
  const zoomOut = () => setScale(Math.max(scale - 0.2, 0.5));
  const rotate = () => setRotation((rotation + 90) % 360);

  return (
    <>
      {/* Feed View - PDF Preview Card */}
      <div
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
          className
        )}
        onClick={handleOpenModal}
      >
        {/* PDF Preview */}
        <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-950">
          {/* PDF Document Mockup */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="relative w-full max-w-48">
              {/* Document Shadow */}
              <div className="absolute inset-0 bg-black/10 rounded-lg transform rotate-3 translate-x-1 translate-y-1"></div>
              
              {/* Document Background */}
              <div className="relative bg-white rounded-lg shadow-lg p-4 transform -rotate-1">
                {/* Document Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">PDF Document</span>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                
                {/* Document Content Lines */}
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                </div>
                
                {/* Document Footer */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{filename || 'Document'}</span>
                    {fileSize && <span>{formatFileSize(fileSize)}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/20">
            <div className="flex items-center space-x-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg transition-all duration-200 group-hover:scale-110 opacity-0 group-hover:opacity-100">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Preview PDF</span>
            </div>
          </div>

          {/* PDF Badge */}
          <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            PDF
          </div>

          {/* File Info Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            {fileSize && formatFileSize(fileSize)}
          </div>
        </div>

        {/* PDF Info */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 truncate">{filename || 'PDF Document'}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>PDF Document</span>
                </span>
                {fileSize && (
                  <span className="flex items-center space-x-1">
                    <span>•</span>
                    <span>{formatFileSize(fileSize)}</span>
                  </span>
                )}
                {pageCount && (
                  <span className="flex items-center space-x-1">
                    <span>•</span>
                    <span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Modal Viewer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 mx-4 w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <h2 className="text-lg font-semibold">{filename || 'PDF Document'}</h2>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {fileSize && <span>{formatFileSize(fileSize)}</span>}
                    {pageCount && <span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} {pageCount && `of ${pageCount}`}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={pageCount ? currentPage >= pageCount : false}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={scale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-800">
              {isLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading PDF...</p>
                  </div>
                </div>
              )}
              
              {hasError && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-500 mb-2">Failed to load PDF</p>
                    <p className="text-sm text-muted-foreground mb-4">The PDF may be unavailable or corrupted</p>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Instead
                    </Button>
                  </div>
                </div>
              )}
              
              <div
                className="mx-auto bg-white shadow-lg"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center top',
                  transition: 'transform 0.2s ease-in-out'
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={`${pdfUrl}#page=${currentPage}`}
                  className="w-full border-0"
                  style={{ minHeight: '800px' }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
