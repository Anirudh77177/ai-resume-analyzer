import { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, XCircle, FileText, Clock, ChevronRight, User } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [studentName, setStudentName] = useState(''); // Naya State: Applicant Name ke liye
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  // Load history on initial render
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/history');
      setHistory(res.data.data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file || !jd || !studentName) {
      setError('Please provide your name, upload a resume, and enter a job description.');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jd);

    try {
      // 1. Pehle Gemini AI se analysis karwao
      const response = await axios.post('http://localhost:5000/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const aiData = response.data.data;
      setResult(aiData);

      // 2. 🚀 N8N AUR NOTION KO DATA BHEJNE KA MAGIC YAHAN HAI 🚀
      try {
        // Notion mein kya bhejna hai uski summary bana li
        const summaryText = `Match Score: ${aiData.match_score}% | Matched Skills: ${aiData.matched_keywords.join(', ')}`;
        
        await axios.post('http://localhost:5000/api/n8n/analyze', {
          studentName: studentName,
          resumeText: summaryText
        });
        console.log("Success! Data sent to Notion via n8n.");
      } catch (n8nErr) {
        console.error("Failed to trigger n8n automation", n8nErr);
      }

      // Naya result aane ke baad history update kar do
      fetchHistory(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong on the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">AI Resume Analyzer</h1>
          <p className="mt-2 text-lg text-gray-600">Upload your PDF resume and check how well it matches the job description.</p>
        </div>

        {/* Main Analyzer Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left Side: Inputs */}
            <div className="space-y-6">
              
              {/* Applicant Name Input (NAYA ADD KIYA HAI) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Applicant Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full pl-10 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="e.g. Anirudh Kumar"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300">
                <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer"
                />
                {file && <p className="mt-3 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">{file.name} selected</p>}
              </div>

              {/* JD Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Job Description</label>
                <textarea 
                  rows="5" 
                  value={jd} 
                  onChange={(e) => setJd(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
                  placeholder="e.g. Looking for a Full Stack Intern with MERN stack expertise..."
                ></textarea>
              </div>

              {error && <p className="text-red-500 text-sm font-medium flex items-center"><XCircle className="w-4 h-4 mr-1"/>{error}</p>}

              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-300 disabled:bg-blue-300 flex justify-center items-center"
              >
                {loading ? 'Reading Context & Analyzing...' : 'Analyze Match'}
              </button>
            </div>

            {/* Right Side: Results & Skeleton Loader */}
            <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 h-full">
              
              {/* Default State */}
              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-sm font-medium">Results will appear here</p>
                </div>
              )}

              {/* ✨ The Skeleton Loader ✨ */}
              {loading && (
                <div className="space-y-6 animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-28 w-full"></div>
                  
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-28"></div>
                    </div>
                  </div>

                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="flex flex-wrap gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actual Result */}
              {result && !loading && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Match Score</p>
                    <p className={`text-6xl font-extrabold mt-2 ${result.match_score >= 75 ? 'text-green-500' : result.match_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {result.match_score}%
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500"/> Matched Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_keywords.length > 0 ? result.matched_keywords.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 shadow-sm">
                          {skill}
                        </span>
                      )) : <span className="text-sm text-gray-500">No matching skills found.</span>}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center"><XCircle className="w-4 h-4 mr-2 text-red-500"/> Missing Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_keywords.length > 0 ? result.missing_keywords.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 shadow-sm">
                          {skill}
                        </span>
                      )) : <span className="text-sm text-gray-500">Perfect match! No missing skills.</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 🕰️ Past History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" /> Recent Analyses
            </h2>
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition duration-200 border border-gray-100">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.jobDescription.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${item.match_score >= 75 ? 'bg-green-100 text-green-700' : item.match_score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {item.match_score}% Match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;