import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Lightbulb,
  Send,
  Sparkles,
  Search,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  FileCode,
  Edit3,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import labService from '../../services/labService';
import Button from '../common/Button';

export const AIMentorPane = ({ session, onSelectTab }) => {
  const labId = session?.labId;
  const isK8sLive = session?.mode === 'kubernetes';
  const namespace = session?.namespace || 'kubementor-sandbox';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentHintLevel, setCurrentHintLevel] = useState(1);
  const [providerMode, setProviderMode] = useState('fallback'); // 'fallback' or 'gemini'
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history on mount or lab change
  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      if (!labId) return;
      setInitialLoading(true);
      setErrorMessage(null);

      try {
        const res = await labService.aiHistory(labId);
        if (isMounted) {
          const loadedMessages =
            res?.data?.data?.messages ||
            res?.data?.messages ||
            res?.messages ||
            (Array.isArray(res) ? res : []);
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
            // Detect provider from last message
            const lastMsg = loadedMessages[loadedMessages.length - 1];
            if (lastMsg?.provider) {
              setProviderMode(lastMsg.provider);
            }
          } else {
            // Seed with welcoming prompt
            setMessages([
              {
                role: 'assistant',
                content: `Hello! I am KubeMentor, your context-aware Kubernetes troubleshooting mentor. I am grounded in live telemetry from namespace \`${namespace}\`. I will guide you systematically through observation, hypothesis, and resolution without spoiling the solution immediately.`,
                mode: 'chat',
                createdAt: new Date(),
              },
            ]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[AIMentorPane] Could not load chat history:', err.message);
          setMessages([
            {
              role: 'assistant',
              content: `Hello! I am KubeMentor. How can I assist with your investigation for \`${session?.title || labId}\`?`,
              mode: 'chat',
              createdAt: new Date(),
            },
          ]);
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [labId, namespace, session?.title]);

  // Handle Proactive Diagnosis
  const handleDiagnose = async () => {
    if (!labId || loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await labService.aiDiagnose(labId);
      const aiResp = res?.data?.data?.aiResponse || res?.data?.aiResponse || res?.aiResponse || res || {};
      setProviderMode(aiResp.provider || 'fallback');

      const newMsg = {
        role: 'assistant',
        content: aiResp.diagnosis?.summary || aiResp.likelyCause || 'Diagnosis generated.',
        mode: 'diagnose',
        confidence: aiResp.diagnosis?.confidence,
        evidence: aiResp.evidence || [],
        observations: aiResp.observations || [],
        nextSteps: aiResp.nextSteps || [],
        likelyCause: aiResp.likelyCause,
        hint: aiResp.hint,
        provider: aiResp.provider,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to generate AI diagnosis.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Progressive Hint Request
  const handleGetHint = async (level = null) => {
    if (!labId || loading) return;
    const targetLevel = level || currentHintLevel;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await labService.aiHint(labId, targetLevel);
      const aiResp = res?.data?.data?.aiResponse || res?.data?.aiResponse || res?.aiResponse || res || {};
      const returnedLevel = res?.data?.hintLevel || res?.hintLevel || targetLevel;
      setProviderMode(aiResp.provider || 'fallback');

      const newMsg = {
        role: 'assistant',
        content: aiResp.hint || `Progressive Hint Level ${returnedLevel}`,
        mode: 'hint',
        hintLevel: returnedLevel,
        confidence: aiResp.diagnosis?.confidence,
        evidence: aiResp.evidence || [],
        observations: aiResp.observations || [],
        nextSteps: aiResp.nextSteps || [],
        likelyCause: aiResp.likelyCause,
        provider: aiResp.provider,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, newMsg]);
      // Advance to next hint level if not at max
      setCurrentHintLevel(returnedLevel < 4 ? returnedLevel + 1 : 4);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to retrieve hint.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Hypothesis Review
  const handleReviewHypothesis = async () => {
    if (!labId || loading) return;
    const prompt = "Could you analyze the telemetry context against the hypothesis I documented in my Scratchpad?";
    handleSendMessage(prompt);
  };

  // Handle Interactive Chat Message
  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputText;
    if (!text || text.trim().length === 0 || loading) return;

    const trimmed = text.trim();
    setInputText('');
    setLoading(true);
    setErrorMessage(null);

    // Optimistically add user message
    const userMsg = {
      role: 'user',
      content: trimmed,
      mode: 'chat',
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await labService.aiChat(labId, trimmed);
      const aiResp = res?.data?.data?.aiResponse || res?.data?.aiResponse || res?.aiResponse || res || {};
      setProviderMode(aiResp.provider || 'fallback');

      const assistantMsg = {
        role: 'assistant',
        content: aiResp.diagnosis?.summary || aiResp.likelyCause || aiResp.hint || 'Here are my findings.',
        mode: 'chat',
        confidence: aiResp.diagnosis?.confidence,
        evidence: aiResp.evidence || [],
        observations: aiResp.observations || [],
        nextSteps: aiResp.nextSteps || [],
        likelyCause: aiResp.likelyCause,
        hint: aiResp.hint,
        provider: aiResp.provider,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Unable to get response from AI Mentor.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 bg-[#000000] rounded-xl border border-[#1e293b]/80 flex flex-col overflow-hidden font-sans text-xs shadow-2xl">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#000000] border-b border-[#1e293b]/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100 font-mono tracking-wide">KubeMentor AI</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {isK8sLive ? 'Live K8s' : 'Sandbox Telemetry'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Grounded Mentor • {providerMode === 'gemini' ? 'Gemini 3.6 Flash' : 'Deterministic Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>
        </div>
      </div>

      {/* Progressive Hint Ribbon */}
      <div className="px-3.5 py-2 bg-[#000000] border-b border-[#1e293b]/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Progressive Hint System
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Level {currentHintLevel} of 4
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { level: 1, label: 'L1: Direction' },
            { level: 2, label: 'L2: Evidence' },
            { level: 3, label: 'L3: Root Cause' },
            { level: 4, label: 'L4: Fix' },
          ].map((item) => (
            <button
              key={item.level}
              onClick={() => handleGetHint(item.level)}
              disabled={loading}
              className={`p-1 rounded text-[10px] font-mono transition-all border text-center cursor-pointer ${
                currentHintLevel === item.level
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : item.level < currentHintLevel
                  ? 'bg-[#080d14] text-slate-300 border-slate-750 hover:bg-slate-900'
                  : 'bg-[#000000] text-slate-500 border-[#1e293b] hover:bg-slate-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Suggestion Strip */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000000] border-b border-[#1e293b]/80 overflow-x-auto scrollbar-none">
        <button
          onClick={handleDiagnose}
          disabled={loading}
          className="px-2 py-1 rounded bg-[#080d14] hover:bg-emerald-950/40 hover:text-emerald-300 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
        >
          <Search className="w-3 h-3 text-emerald-400" /> Analyze Failure
        </button>
        <button
          onClick={() => handleGetHint()}
          disabled={loading}
          className="px-2 py-1 rounded bg-[#080d14] hover:bg-amber-950/40 hover:text-amber-300 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
        >
          <Lightbulb className="w-3 h-3 text-amber-400" /> Give me a hint
        </button>
        <button
          onClick={handleReviewHypothesis}
          disabled={loading}
          className="px-2 py-1 rounded bg-[#080d14] hover:bg-indigo-950/40 hover:text-indigo-300 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
        >
          <FileSearch className="w-3 h-3 text-indigo-400" /> Check My Notes
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 select-text bg-[#000000]">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            <p className="text-xs font-mono">Connecting to KubeMentor AI...</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-emerald-600 text-slate-950 font-medium rounded-br-xs shadow-md'
                      : 'bg-[#080d14] border border-[#1e293b] text-slate-200 rounded-bl-xs shadow-lg'
                  }`}
                >
                  {/* Mode / Confidence Header for AI responses */}
                  {!isUser && (msg.mode || msg.hintLevel) && (
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5 mb-1.5 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        {msg.mode === 'hint' ? (
                          <>
                            <Lightbulb className="w-3 h-3 text-amber-400" />
                            Hint Level {msg.hintLevel}
                          </>
                        ) : msg.mode === 'diagnose' ? (
                          <>
                            <Search className="w-3 h-3 text-emerald-400" />
                            Failure Diagnosis
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-emerald-400" />
                            AI Guidance
                          </>
                        )}
                      </span>
                      {msg.confidence && (
                        <span className="px-1.5 py-0.2 rounded bg-[#000000] text-slate-400 border border-slate-800 text-[9px]">
                          Confidence: {msg.confidence}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Main Body */}
                  <div className="whitespace-pre-wrap font-sans text-slate-200">
                    {msg.content}
                  </div>

                  {/* Observations Section */}
                  {msg.observations && msg.observations.length > 0 && (
                    <div className="bg-[#000000] p-2 rounded-lg border border-[#1e293b] text-[11px] space-y-1 mt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">Observed Facts</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {msg.observations.map((obs, oIdx) => (
                          <li key={oIdx}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Evidence Badges */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {msg.evidence.map((ev, eIdx) => (
                        <span
                          key={eIdx}
                          className="px-1.5 py-0.5 rounded bg-[#000000] text-[10px] font-mono text-slate-300 border border-slate-800"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Next Steps Recommendations */}
                  {msg.nextSteps && msg.nextSteps.length > 0 && (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg text-[11px] space-y-1 mt-2">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 block uppercase flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> Recommended Investigation Steps
                      </span>
                      <ul className="space-y-1 text-slate-300">
                        {msg.nextSteps.map((step, sIdx) => {
                          const isCommand = step.startsWith('Run ') || step.includes('kubectl');
                          return (
                            <li key={sIdx} className="flex items-start justify-between gap-1">
                              <span>• {step}</span>
                              {isCommand && (
                                <button
                                  onClick={() => copyToClipboard(step.replace(/^Run ['"]|['"]$/g, ''), `${idx}-${sIdx}`)}
                                  className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 shrink-0 p-0.5 cursor-pointer"
                                  title="Copy inspection command"
                                >
                                  {copiedIndex === `${idx}-${sIdx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Direct Navigation Links for Action */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#1e293b] text-[10px] font-mono text-slate-400">
                      <button
                        onClick={() => onSelectTab && onSelectTab('terminal')}
                        className="hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Terminal className="w-3 h-3" /> Terminal
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => onSelectTab && onSelectTab('editor')}
                        className="hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileCode className="w-3 h-3" /> YAML
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => onSelectTab && onSelectTab('scratchpad')}
                        className="hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Scratchpad
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    U
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Thinking Indicator */}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#080d14] border border-[#1e293b] rounded-xl p-3 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span className="font-mono text-[11px]">Analyzing runtime telemetry and evaluating context...</span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-2.5 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px]">
              <span className="font-bold block">AI Request Notice:</span>
              {errorMessage}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-2.5 bg-[#000000] border-t border-[#1e293b]/80 space-y-1.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            maxLength={2000}
            placeholder="Ask AI Mentor a question about this failure..."
            className="flex-1 bg-[#080d14] border border-[#1e293b] focus:border-emerald-500/60 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>Press Enter to send • 2,000 max chars</span>
          <span>{inputText.length} / 2,000</span>
        </div>
      </div>
    </div>
  );
};

export default AIMentorPane;
