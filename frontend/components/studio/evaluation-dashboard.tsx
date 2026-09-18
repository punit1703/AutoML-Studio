"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Trophy, Target, BarChart2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, ScatterChart, Scatter, ZAxis
} from "recharts";

export default function EvaluationDashboard({ result }: { result: any }) {
  const [selectedModel, setSelectedModel] = useState<any>(
    result.models_evaluated.find((m: any) => m.model_name === result.best_model.name) || result.models_evaluated[0]
  );

  const models = result.models_evaluated.sort((a: any, b: any) => {
    if (a.status !== "success") return 1;
    if (b.status !== "success") return -1;
    return b.evaluation.primary_score - a.evaluation.primary_score;
  });

  const isRegression = result.problem_type === "Regression";

  return (
    <div className="space-y-8">
      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono">
            <Trophy className="w-5 h-5 text-primary" /> Model Leaderboard
          </CardTitle>
          <CardDescription>
            Trained on {result.dataset_rows} rows. 
            Primary metric selected based on problem type and data distribution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                <tr>
                  <th className="px-4 py-3 font-mono">Model</th>
                  <th className="px-4 py-3 font-mono">Primary Metric</th>
                  <th className="px-4 py-3 font-mono">Secondary Metrics</th>
                  <th className="px-4 py-3 font-mono">Time (s)</th>
                  <th className="px-4 py-3 font-mono">Status</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model: any, i: number) => {
                  const isBest = model.model_name === result.best_model.name;
                  const isSelected = selectedModel?.model_name === model.model_name;
                  
                  return (
                    <tr 
                      key={model.model_name}
                      onClick={() => model.status === 'success' && setSelectedModel(model)}
                      className={`border-b border-border transition-colors ${model.status === 'success' ? 'cursor-pointer hover:bg-muted/30' : 'opacity-50'} ${isSelected ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-4 font-bold flex items-center gap-2">
                        {isBest && <Trophy className="w-4 h-4 text-warning" />}
                        {model.model_name}
                      </td>
                      <td className="px-4 py-4">
                        {model.status === 'success' && (
                          <div className="flex flex-col">
                            <span className="font-bold text-primary font-mono text-lg">
                              {model.evaluation.primary_score.toFixed(4)}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                              {model.evaluation.primary_metric}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {model.status === 'success' && (
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(model.evaluation.metrics)
                              .filter(([k]) => k !== model.evaluation.primary_metric && k !== 'cv_score')
                              .slice(0, 3)
                              .map(([k, v]: [string, any]) => (
                                <div key={k} className="bg-secondary px-2 py-1 rounded text-xs">
                                  <span className="text-muted-foreground uppercase">{k}:</span> <span className="font-mono">{v.toFixed(3)}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {model.training_time}s
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {model.status === 'success' ? (
                          <span className="text-success flex items-center gap-1 text-xs uppercase font-bold"><CheckCircle2 className="w-4 h-4" /> Success</span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1 text-xs uppercase font-bold"><XCircle className="w-4 h-4" /> Failed</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deep Evaluation Details */}
      {selectedModel && selectedModel.status === 'success' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-mono flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Evaluation: {selectedModel.model_name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SHAP Model Explainability */}
            {result.best_model.name === selectedModel.model_name && result.best_model.shap_summary && (
              <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" /> Model Explanation (SHAP)
                  </CardTitle>
                  <CardDescription>
                    Feature contribution toward the model's predictions. Features at the top have the strongest association with the outcome.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={result.best_model.shap_summary.map((f: any) => ({ name: f[0], importance: f[1] }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                      <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="importance" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Feature Importance (Native) */}
            {selectedModel.evaluation.diagnostics?.feature_importance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">Feature Importance</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedModel.evaluation.diagnostics.feature_importance.map((f: any) => ({ name: f[0], value: f[1] }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                      <RechartsTooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* ROC Curve for Classification */}
            {!isRegression && selectedModel.evaluation.diagnostics?.roc_curve && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">ROC Curve (AUC = {selectedModel.evaluation.metrics.roc_auc?.toFixed(4)})</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedModel.evaluation.diagnostics.roc_curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="tpr" type="number" domain={[0, 1]} stroke="hsl(var(--muted-foreground))" />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="tpr" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      {/* Random Guess Line */}
                      <Line type="linear" dataKey="fpr" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Actual vs Predicted for Regression */}
            {isRegression && selectedModel.evaluation.diagnostics?.actual_vs_predicted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">Actual vs Predicted</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" dataKey="actual" name="Actual" stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="number" dataKey="predicted" name="Predicted" stroke="hsl(var(--muted-foreground))" />
                      <ZAxis range={[20, 20]} />
                      <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Scatter name="Predictions" data={selectedModel.evaluation.diagnostics.actual_vs_predicted} fill="hsl(var(--primary))" opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Confusion Matrix for Classification */}
            {!isRegression && selectedModel.evaluation.diagnostics?.confusion_matrix && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono flex justify-between items-center">
                    <span>Confusion Matrix</span>
                    <span className="text-xs text-muted-foreground font-sans font-normal">X: Predicted, Y: Actual</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="grid gap-1">
                    {selectedModel.evaluation.diagnostics.confusion_matrix.map((row: number[], i: number) => (
                      <div key={i} className="flex gap-1">
                        {row.map((val: number, j: number) => {
                          const maxVal = Math.max(...selectedModel.evaluation.diagnostics.confusion_matrix.flat());
                          const intensity = Math.max(0.1, val / maxVal);
                          return (
                            <div 
                              key={`${i}-${j}`} 
                              className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center rounded-md text-sm font-mono font-bold transition-all hover:scale-105"
                              style={{ 
                                backgroundColor: `rgba(56, 189, 248, ${intensity})`,
                                color: intensity > 0.5 ? '#fff' : 'inherit'
                              }}
                              title={`Actual: ${selectedModel.evaluation.diagnostics.classes?.[i] || i}, Predicted: ${selectedModel.evaluation.diagnostics.classes?.[j] || j}`}
                            >
                              <span>{val}</span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
