import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadAPI, transactionsAPI } from '../services/api';
import { Upload, FileText, Image, CheckCircle, AlertCircle, X, History, DollarSign, Calendar, Tag, TrendingUp, TrendingDown } from 'lucide-react';

const UploadReceipt = () => {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadType, setUploadType] = useState('receipt'); // 'receipt' or 'history'
  const [transactionHistory, setTransactionHistory] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(0);
    setError('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('receipt', selectedFile);

      let response;
      if (uploadType === 'history') {
        response = await uploadAPI.uploadTransactionHistory(formData);
      } else {
        response = await uploadAPI.uploadReceipt(formData);
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.data.success) {
        console.log('Upload response:', response.data);
        
        if (uploadType === 'history') {
          setTransactionHistory(response.data.data.extractedData);
          setSelectedTransactions(response.data.data.extractedData.transactions || []);
        } else {
          setExtractedData(response.data.data.extractedData);
        }
        
        setUploadedFileName(response.data.data.file.filename);
        setUploadState('success');
      } else {
        throw new Error(response.data.message || 'Failed to process file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to upload file');
      setUploadState('error');
    }
  };

  const handleCreateTransaction = async () => {
    if (!extractedData) return;

    try {
      setUploadState('uploading');
      
      const transactionData = {
        amount: extractedData.amount,
        description: extractedData.merchant ? `Purchase from ${extractedData.merchant}` : 'Receipt transaction',
        type: 'expense',
        category: null,
        suggestedCategory: extractedData.category, // Send Gemini's category suggestion
        date: extractedData.date || new Date().toISOString(),
        filename: uploadedFileName
      };

      console.log('Creating transaction with data:', transactionData);

      // Create the transaction using the receipt endpoint
      const response = await uploadAPI.createTransactionFromReceipt(transactionData);
      
      console.log('Transaction created:', response.data);
      
      setUploadState('success');
      alert('Transaction created successfully!');
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('Failed to create transaction from receipt data');
      setUploadState('error');
    }
  };

  const handleBulkCreateTransactions = async () => {
    if (!selectedTransactions.length) return;

    try {
      setUploadState('uploading');
      
      const response = await uploadAPI.bulkCreateTransactions({
        transactions: selectedTransactions,
        filename: uploadedFileName
      });
      
      console.log('Bulk transactions created:', response.data);
      
      setUploadState('success');
      alert(`Successfully created ${response.data.data.createdTransactions.length} transactions!`);
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error creating bulk transactions:', error);
      setError('Failed to create transactions from history');
      setUploadState('error');
    }
  };

  const toggleTransactionSelection = (index) => {
    setSelectedTransactions(prev => {
      const isSelected = prev.some(t => t.originalIndex === index);
      if (isSelected) {
        return prev.filter(t => t.originalIndex !== index);
      } else {
        const transaction = transactionHistory.transactions[index];
        return [...prev, { ...transaction, originalIndex: index }];
      }
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractedData(null);
    setTransactionHistory(null);
    setSelectedTransactions([]);
    setUploadedFileName(null);
    setUploadState('idle');
    setUploadProgress(0);
    setError('');
    // Reset file input
    const fileInput = document.getElementById('receipt-file');
    if (fileInput) fileInput.value = '';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Receipt & Transaction History</h1>
        <p className="text-muted-foreground">Extract transaction data from receipts or bulk import from PDF transaction history</p>
      </div>

      {/* Upload Type Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              variant={uploadType === 'receipt' ? 'default' : 'outline'}
              onClick={() => {
                setUploadType('receipt');
                resetForm();
              }}
              className="flex-1"
            >
              <Image className="w-4 h-4 mr-2" />
              Single Receipt
            </Button>
            <Button
              variant={uploadType === 'history' ? 'default' : 'outline'}
              onClick={() => {
                setUploadType('history');
                resetForm();
              }}
              className="flex-1"
            >
              <History className="w-4 h-4 mr-2" />
              Transaction History PDF
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {uploadType === 'receipt' 
              ? 'Upload individual receipt images or PDFs for single transactions'
              : 'Upload bank statement or transaction history PDFs for bulk import'
            }
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {uploadType === 'receipt' ? 'Upload Receipt' : 'Upload Transaction History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt-file">
                {uploadType === 'receipt' ? 'Select Receipt File' : 'Select PDF Transaction History'}
              </Label>
              <Input
                id="receipt-file"
                type="file"
                accept={uploadType === 'receipt' ? 'image/*,.pdf' : '.pdf'}
                onChange={handleFileSelect}
                className="mt-1"
                disabled={uploadState === 'uploading'}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {uploadType === 'receipt' 
                  ? 'Supported formats: JPEG, PNG, WebP, PDF (max 10MB)'
                  : 'Supported format: PDF bank statements or transaction history (max 10MB)'
                }
              </p>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image className="h-8 w-8 text-blue-600" />
                    ) : (
                      <FileText className="h-8 w-8 text-red-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                {preview && (
                  <div className="mt-4">
                    <Label>Preview</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                    </div>
                  </div>
                )}

                {uploadState === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {uploadType === 'receipt' ? 'Processing receipt...' : 'Processing transaction history...'}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadState === 'uploading'}
                    className="flex-1"
                  >
                    {uploadState === 'uploading' ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadType === 'receipt' ? 'Extract Data' : 'Extract Transactions'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadState === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {uploadType === 'receipt' ? 'Extracted Data' : 'Transaction History'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadState === 'idle' && (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {uploadType === 'receipt' 
                    ? 'Upload a receipt to see extracted transaction data'
                    : 'Upload a PDF to see extracted transaction history'
                  }
                </p>
              </div>
            )}

            {uploadState === 'uploading' && (
              <div className="text-center py-8">
                <LoadingSpinner message={
                  uploadType === 'receipt' 
                    ? "Analyzing receipt with OCR..." 
                    : "Extracting transaction history..."
                } />
              </div>
            )}

            {uploadState === 'error' && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <p className="text-red-600 mb-4">
                  {uploadType === 'receipt' ? 'Failed to process receipt' : 'Failed to process transaction history'}
                </p>
                <Button variant="outline" onClick={() => setUploadState('idle')}>
                  Try Again
                </Button>
              </div>
            )}

            {uploadState === 'success' && uploadType === 'receipt' && extractedData && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Receipt processed successfully!</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Amount</Label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(extractedData.amount || 0)}
                      </p>
                    </div>
                    
                    {extractedData.merchant && (
                      <div>
                        <Label className="text-sm font-medium">Merchant</Label>
                        <p className="text-sm">{extractedData.merchant}</p>
                      </div>
                    )}
                    
                    {extractedData.date && (
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <p className="text-sm">
                          {new Date(extractedData.date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    {extractedData.category && (
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <p className="text-sm capitalize">{extractedData.category}</p>
                      </div>
                    )}
                    
                    {extractedData.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm">{extractedData.description}</p>
                      </div>
                    )}

                    {extractedData.items && extractedData.items.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Items</Label>
                        <ul className="text-sm space-y-1 mt-1">
                          {extractedData.items.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex justify-between">
                              <span>{item.name}</span>
                              <span>{formatCurrency(item.amount || 0)}</span>
                            </li>
                          ))}
                          {extractedData.items.length > 3 && (
                            <li className="text-muted-foreground">
                              +{extractedData.items.length - 3} more items
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <Button onClick={handleCreateTransaction} className="flex-1">
                      Create Transaction
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Upload Another
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {uploadState === 'success' && uploadType === 'history' && transactionHistory && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Transaction history processed successfully!</span>
                    {transactionHistory.processingMethod && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transactionHistory.processingMethod === 'gemini' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {transactionHistory.processingMethod === 'gemini' ? '🤖 AI Enhanced' : '📝 Pattern Match'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Total</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {transactionHistory.totalTransactions}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Income</span>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(transactionHistory.summary?.totalIncome || 0)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Expenses</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(transactionHistory.summary?.totalExpenses || 0)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Net</span>
                      </div>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(transactionHistory.summary?.netBalance || 0)}
                      </p>
                    </div>
                  </div>

                  {transactionHistory.summary?.dateRange && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(transactionHistory.summary.dateRange.start).toLocaleDateString()} - {' '}
                        {new Date(transactionHistory.summary.dateRange.end).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {transactionHistory.validationResults && (
                    <div className="text-sm text-blue-700 mb-4">
                      <span>
                        Extracted: {transactionHistory.validationResults.totalExtracted}, 
                        Valid: {transactionHistory.validationResults.validTransactions}
                        {transactionHistory.validationResults.rejectedTransactions > 0 && (
                          <span className="text-orange-600">
                            , Rejected: {transactionHistory.validationResults.rejectedTransactions}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleBulkCreateTransactions} 
                      disabled={selectedTransactions.length === 0}
                      className="flex-1"
                    >
                      Create {selectedTransactions.length} Selected Transactions
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Upload Another
                    </Button>
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Select Transactions to Import</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTransactions(transactionHistory.transactions.map((t, i) => ({ ...t, originalIndex: i })))}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTransactions([])}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  {transactionHistory.transactions.map((transaction, index) => {
                    const isSelected = selectedTransactions.some(t => t.originalIndex === index);
                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleTransactionSelection(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTransactionSelection(index)}
                                className="rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">
                                    {transaction.description}
                                  </span>
                                  <span className={`font-bold ${
                                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </span>
                                  {transaction.suggestedCategory && (
                                    <span className="flex items-center gap-1">
                                      <Tag className="h-3 w-3" />
                                      {transaction.suggestedCategory}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>
            {uploadType === 'receipt' ? 'How Receipt Processing Works' : 'How Transaction History Import Works'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadType === 'receipt' ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">1. Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a photo of your receipt or a PDF file
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium">2. Extract</h3>
                <p className="text-sm text-muted-foreground">
                  AI analyzes the receipt and extracts key information
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium">3. Create</h3>
                <p className="text-sm text-muted-foreground">
                  Review and create a transaction from the extracted data
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">1. Upload PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your bank statement or transaction history PDF
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <History className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium">2. Parse</h3>
                <p className="text-sm text-muted-foreground">
                  AI extracts tabular transaction data from the PDF
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-medium">3. Review</h3>
                <p className="text-sm text-muted-foreground">
                  Select which transactions you want to import
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium">4. Import</h3>
                <p className="text-sm text-muted-foreground">
                  Bulk create transactions with automatic categorization
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadReceipt;