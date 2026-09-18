"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Loader2, Globe, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PredictionAppPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [deployment, setDeployment] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [predicting, setPredicting] = React.useState(false);
  const [predictionResult, setPredictionResult] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchDeployment = async () => {
      try {
        const res = await api.get(`v1/deployments/${id}/`);
        setDeployment(res.data);
        
        // Initialize form data using features schema if available
        const initialData: Record<string, any> = {};
        const schema = res.data.schema;
        
        if (schema?.features) {
          schema.features.forEach((feat: any) => { 
            if (!feat.optional) {
              initialData[feat.name] = feat.type === 'boolean' ? false : "";
            }
          });
        } else {
          // Fallback for old models
          if (schema?.numeric) {
            schema.numeric.forEach((col: string) => { initialData[col] = ""; });
          }
          if (schema?.categorical) {
            schema.categorical.forEach((col: string) => { initialData[col] = ""; });
          }
        }
        setFormData(initialData);
        
      } catch (err: any) {
        setError(err.response?.data?.error || "Application not found or inactive.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchDeployment();
  }, [id]);

  const handleInputChange = (col: string, value: any, type: string) => {
    setFormData(prev => ({
      ...prev,
      [col]: type === 'numeric' ? (value === "" ? "" : Number(value)) : value
    }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    setPredictionResult(null);
    
    try {
      const res = await api.post(`v1/deployments/${id}/predict/`, [formData]);
      setPredictionResult(res.data.predictions[0]);
    } catch (err: any) {
      alert("Prediction failed: " + (err.response?.data?.error || err.message));
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="bg-error/10 border border-error p-6 rounded-xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading App</h2>
          <p className="text-error">{error}</p>
        </div>
      </div>
    );
  }

  const { schema, project } = deployment;
  
  // Render dynamic form fields based on the feature schema
  const renderField = (feat: any) => {
    // If it's a legacy schema, feat will just be a string name. Handle both:
    const isLegacyNumeric = typeof feat === 'string' && schema.numeric?.includes(feat);
    const isLegacyCategorical = typeof feat === 'string' && schema.categorical?.includes(feat);
    
    const name = typeof feat === 'string' ? feat : feat.name;
    let type = typeof feat === 'string' ? (isLegacyNumeric ? 'numeric' : 'text') : feat.type;
    
    // Treat legacy text or general text as long_text if modality is text
    if (type === 'text' && schema.modality === 'text') {
      type = 'long_text';
    }
    const options = feat.options || [];
    
    if (feat.hidden) return null;

    const label = feat.label || name;

    return (
      <div key={name}>
        <label className="block text-sm font-medium mb-1.5 flex items-center justify-between">
          {label}
        </label>
        
        {type === 'categorical' && options.length > 0 ? (
          <select
            required={!feat.optional}
            value={formData[name] || ""}
            onChange={(e) => handleInputChange(name, e.target.value, 'categorical')}
            className="w-full h-10 px-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
          >
            <option value="" disabled>Select an option...</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : type === 'boolean' ? (
          <div className="flex items-center gap-4 h-10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name={name}
                checked={formData[name] === true}
                onChange={() => handleInputChange(name, true, 'boolean')}
                className="text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name={name}
                checked={formData[name] === false}
                onChange={() => handleInputChange(name, false, 'boolean')}
                className="text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        ) : type === 'long_text' ? (
          <textarea
            required={!feat.optional}
            value={formData[name] === undefined ? "" : formData[name]}
            onChange={(e) => handleInputChange(name, e.target.value, 'text')}
            className="w-full min-h-[120px] p-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-y"
            placeholder={`Enter ${label}...`}
          />
        ) : (
          <input 
            type={type === 'numeric' ? "number" : "text"}
            step={type === 'numeric' ? "any" : undefined}
            min={type === 'numeric' ? feat.min : undefined}
            max={type === 'numeric' ? feat.max : undefined}
            required={!feat.optional}
            value={formData[name] === undefined ? "" : formData[name]}
            onChange={(e) => handleInputChange(name, e.target.value, type)}
            className="w-full h-10 px-3 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            placeholder={type === 'numeric' && feat.min !== undefined ? `Range: ${feat.min} - ${feat.max}` : undefined}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative selection:bg-primary/40">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Globe className="w-5 h-5 text-primary" />
          Prediction App
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto py-12 px-6 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Predict <span className="text-primary">{deployment.target_column}</span></h1>
            <p className="text-muted-foreground">Powered by AutoML Studio. Enter the required information below to generate a prediction.</p>
          </div>

          <form onSubmit={handlePredict} className="bg-card border border-border p-8 rounded-2xl shadow-xl space-y-6">
            
            {schema?.features ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {schema.features.map(renderField)}
              </div>
            ) : (
              /* Fallback for old schema */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {schema?.numeric?.map((col: string) => renderField(col))}
                {schema?.categorical?.map((col: string) => renderField(col))}
              </div>
            )}


            <div className="pt-6 flex justify-end">
              <button 
                type="submit"
                disabled={predicting}
                className="w-full sm:w-auto px-8 py-3 bg-primary text-background font-bold rounded-lg shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:bg-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 text-lg"
              >
                {predicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Generate Prediction
              </button>
            </div>
          </form>

          <AnimatePresence>
            {predictionResult !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-success/10 border-2 border-success p-8 rounded-2xl text-center shadow-lg"
              >
                <div className="flex items-center justify-center gap-3 text-success mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-semibold text-lg uppercase tracking-wider">Prediction Result</span>
                </div>
                <div className="text-5xl font-black text-foreground font-mono mt-4">
                  {typeof predictionResult === 'number' 
                    ? (Number.isInteger(predictionResult) ? predictionResult : predictionResult.toFixed(4)) 
                    : String(predictionResult)}
                </div>
                <p className="text-muted-foreground mt-4 text-sm">Target: {deployment.target_column}</p>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  );
}
