import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, FileText, History, Loader2, Play, ShieldCheck, Trash2 } from 'lucide-react';
import { BANK_VERSION, practicalGroups, practicalQuestions } from '../../exam/questionBank';
import { createSession, getQuestionStatus, isSessionExpired, submitSession } from '../../exam/session';
import { examRepository, readExamStoragePersistence, requestExamStoragePersistence } from '../../exam/storage';
import { useExamSession } from '../../exam/useExamSession';
import type { ExamMode, ExamSession } from '../../exam/types';
import { ExamWorkspace } from './ExamWorkspace';
import './exam-center.css';

interface ExamCenterProps {
  sessionId?: string;
  tab?: 'practical' | 'theory';
  onOpenSession: (id: string) => void;
  onBack: () => void;
  onTab: (tab: 'practical' | 'theory') => void;
}

const dateTime = (value: number) => new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(value);

function savedCount(session: ExamSession) {
  return session.questionIds.filter(id => {
    const question = practicalQuestions.find(q => q.id === id);
    return question && getQuestionStatus(question, session) === 'complete';
  }).length;
}

function ActiveWorkspace({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const state = useExamSession(sessionId);
  const [exitBusy, setExitBusy] = useState(false);
  if (state.loading) return <div className="exam-load-state"><Loader2 className="exam-spinner" /><h1>正在恢复答卷</h1><p>读取此浏览器保存的答案和附件。</p></div>;
  if (state.loadError || !state.session) return <div className="exam-load-state"><FileText size={36} /><h1>无法打开答卷</h1><p role="alert">{state.loadError || '答卷不存在。'}</p><button className="ec-button" onClick={onBack}><ArrowLeft size={16} />返回考试中心</button></div>;
  const questions = state.session.questionIds.map(id => practicalQuestions.find(q => q.id === id)).filter((q): q is typeof practicalQuestions[number] => Boolean(q));
  if (questions.length !== state.session.questionIds.length) return <div className="exam-load-state"><h1>题库版本不匹配</h1><p>这份答卷包含当前题库中不存在的题目，请保留此浏览器数据。</p><button className="ec-button" onClick={onBack}>返回考试中心</button></div>;
  return <ExamWorkspace
    questions={questions}
    session={state.session}
    files={state.files}
    saveState={exitBusy ? 'saving' : state.saveState}
    error={state.error}
    onSelectQuestion={state.selectQuestion}
    onChangeText={state.changeText}
    onAddFiles={state.addFiles}
    onRemoveFile={state.removeFile}
    onSave={state.flush}
    onToggleMark={state.toggleMark}
    onSubmit={() => state.finish('manual')}
    onExit={() => {
      if (exitBusy) return;
      setExitBusy(true);
      void state.flush().then(onBack).catch(() => undefined).finally(() => setExitBusy(false));
    }}
  />;
}

export function ExamCenter(props: ExamCenterProps) {
  if (props.sessionId) return <ActiveWorkspace key={props.sessionId} sessionId={props.sessionId} onBack={props.onBack} />;
  return <ExamLobby {...props} />;
}

function ExamLobby({ tab = 'practical', onTab, onOpenSession }: ExamCenterProps) {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmStart, setConfirmStart] = useState<ExamMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamSession | null>(null);
  const [persistence, setPersistence] = useState(readExamStoragePersistence);
  const refresh = useCallback(async () => {
    try {
      setError('');
      const stored = await examRepository.listSessions();
      const restored: ExamSession[] = [];
      for (const entry of stored) {
        if (isSessionExpired(entry)) {
          const submitted = submitSession(entry, 'timeout');
          await examRepository.saveSession(submitted);
          restored.push(submitted);
        } else restored.push(entry);
      }
      setSessions(restored.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (cause) {
      setError(cause instanceof Error ? `无法读取答题记录：${cause.message}` : '浏览器存储不可用，请检查浏览器设置后重试。');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const focused = () => { void refresh(); };
    window.addEventListener('focus', focused);
    return () => window.removeEventListener('focus', focused);
  }, [refresh]);
  const begin = async (mode: ExamMode) => {
    setBusy(true);
    setError('');
    try {
      const session = createSession(mode, practicalQuestions, BANK_VERSION);
      setPersistence(await requestExamStoragePersistence());
      await examRepository.saveSession(session);
      setConfirmStart(null);
      onOpenSession(session.id);
    } catch (cause) {
      setError(cause instanceof Error ? `无法开始作答：${cause.message}` : '无法保存新答卷，请稍后重试。');
    } finally { setBusy(false); }
  };
  const practice = sessions.find(s => s.mode === 'practice' && s.status === 'active');
  const exam = sessions.find(s => s.mode === 'exam' && s.status === 'active');

  return <div className="exam-center">
    <div className="ec-heading"><div><h1>考试中心</h1><p>人工智能训练师三级操作技能，从逐题练习到完整模拟考试。</p></div><span className="ec-level">三级 / 高级工</span></div>
    <div className="ec-tabs" role="tablist" aria-label="考试类别">
      <button id="practical-tab" role="tab" aria-selected={tab === 'practical'} aria-controls="exam-category-panel" onClick={() => onTab('practical')}>实操考试</button>
      <button id="theory-tab" role="tab" aria-selected={tab === 'theory'} aria-controls="exam-category-panel" onClick={() => onTab('theory')}>理论考试</button>
    </div>
    <div id="exam-category-panel" role="tabpanel" aria-labelledby={tab === 'practical' ? 'practical-tab' : 'theory-tab'}>
      {tab === 'theory' ? <section className="ec-theory"><BookOpen size={38} strokeWidth={1.4} /><h2>理论考试暂未开放</h2><p>先从操作技能练习开始，熟悉原题与考试流程。</p><button className="ec-button" onClick={() => onTab('practical')}>进入实操考试<ArrowRight size={16} /></button></section> : <>
        <div className="ec-mode-grid">
          <section className="ec-mode"><BookOpen size={25} strokeWidth={1.6} /><h2>全题练习</h2><p>按原题逐项作答，熟悉每种任务和提交要求。可随时保存，下次接着练。</p><div className="ec-mode-facts"><span><strong>40</strong> 道原题</span><span>8 个单元</span><span>不限时</span></div><button className="ec-button" disabled={loading || busy || Boolean(error)} onClick={() => practice ? onOpenSession(practice.id) : void begin('practice')}><Play size={16} />{practice ? `继续练习 · 已完成 ${savedCount(practice)}/40 题` : '开始全题练习'}</button></section>
          <section className="ec-mode ec-exam-mode"><Clock3 size={25} strokeWidth={1.6} /><h2>模拟考试</h2><p>按正式考核方案随机组卷，完整体验下载材料、作答、保存与交卷流程。</p><div className="ec-mode-facts"><span><strong>6</strong> 道题</span><span><strong>100</strong> 分</span><span><strong>120</strong> 分钟</span></div><button className="ec-button" disabled={loading || busy || Boolean(error)} onClick={() => exam ? onOpenSession(exam.id) : setConfirmStart('exam')}><Play size={16} />{exam ? '继续未完成的考试' : '开始模拟考试'}</button></section>
        </div>
        <div className="ec-storage-note"><ShieldCheck size={17} /><p>答案和提交文件仅保存在当前浏览器。切换设备或清理网站数据后无法恢复。{persistence === 'granted' ? '浏览器已允许长期保存。' : '浏览器可能在长时间未访问后清理答卷，请定期完成练习。'}操作题请在本地 Jupyter、Excel / WPS 等工具中完成。</p></div>
        {error && <div className="ec-error" role="alert">{error}<button onClick={() => void refresh()}>重试</button></div>}
        <section className="ec-bank-section"><div className="ec-section-heading"><h2>题库范围与组卷规则</h2><span>沿用原题与原始操作材料</span></div><div className="ec-table-scroll"><table className="ec-rule-table"><thead><tr><th scope="col">考核单元</th><th scope="col">题号范围</th><th scope="col">题量</th><th scope="col">考试抽取</th><th scope="col">分值</th></tr></thead><tbody>{practicalGroups.map((group, index) => <tr key={group.id}><th scope="row">{group.title}</th><td>{group.id}.1 — {group.id}.5</td><td>5 题</td>{(index === 0 || index === 6) ? <td rowSpan={2}>两个单元合并<br /><strong>10 抽 1</strong></td> : (index !== 1 && index !== 7) ? <td>5 抽 1</td> : null}<td>{group.points} 分</td></tr>)}</tbody><tfoot><tr><th scope="row">考试合计</th><td colSpan={2}>40 题题库</td><td>抽取 6 题</td><td>100 分</td></tr></tfoot></table></div></section>
        <section className="ec-history"><div className="ec-section-heading"><h2><History size={19} />作答记录</h2><span>保存在此浏览器</span></div>{loading ? <div className="ec-empty"><Loader2 className="exam-spinner" size={20} />正在读取记录…</div> : sessions.length === 0 ? <div className="ec-empty"><FileText size={26} strokeWidth={1.5} /><p>还没有作答记录</p><span>开始一次练习或考试后，可在这里继续作答或查看答卷。</span></div> : <ul className="ec-session-list">{sessions.map(session => <li key={session.id}><span className={`ec-session-icon ${session.status === 'submitted' ? 'submitted' : ''}`}>{session.status === 'submitted' ? <CheckCircle2 size={20} /> : <FileText size={20} />}</span><div className="ec-session-info"><strong>{session.mode === 'exam' ? '模拟考试' : '全题练习'}<span className={`ec-state ${session.status}`}>{session.status === 'submitted' ? (session.submissionReason === 'timeout' ? '到时交卷' : '已提交') : '进行中'}</span></strong><span>{dateTime(session.startedAt)} 开始 · 已完成 {savedCount(session)}/{session.questionIds.length} 题{session.status === 'submitted' ? ' · 未评分' : ''}</span></div><button className="ec-record-open" onClick={() => onOpenSession(session.id)}>{session.status === 'submitted' ? '查看答卷' : '继续作答'}<ArrowRight size={15} /></button><button className="ec-delete" aria-label={`删除${dateTime(session.startedAt)}的${session.mode === 'exam' ? '考试' : '练习'}记录`} onClick={() => setDeleteTarget(session)}><Trash2 size={16} /></button></li>)}</ul>}</section>
      </>}
    </div>
    {confirmStart && <div className="ec-modal-backdrop" onClick={() => !busy && setConfirmStart(null)}><section className="ec-modal" role="dialog" aria-modal="true" aria-labelledby="exam-start-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape' && !busy) setConfirmStart(null); }}><Clock3 size={30} /><h2 id="exam-start-title">准备开始模拟考试</h2><p>系统将按考核方案随机抽取 6 题，试卷满分 100 分。</p><ul><li>确认开始后立即计时，共 120 分钟。</li><li>退出页面或关闭浏览器期间继续计时，时间结束自动交卷。</li><li>下载材料后，在本地工具中完成操作，再提交所需文件。</li><li>本期保存答卷，不提供评分。</li></ul><div className="ec-modal-actions"><button autoFocus className="ec-button ec-button-secondary" disabled={busy} onClick={() => setConfirmStart(null)}>再准备一下</button><button className="ec-button" disabled={busy} onClick={() => void begin(confirmStart)}>{busy ? '正在创建…' : '确认开始考试'}</button></div></section></div>}
    {deleteTarget && <div className="ec-modal-backdrop" onClick={() => !busy && setDeleteTarget(null)}><section className="ec-modal" role="dialog" aria-modal="true" aria-labelledby="exam-delete-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape' && !busy) setDeleteTarget(null); }}><h2 id="exam-delete-title">删除这份答卷？</h2><p>将删除这次作答的所有答案和提交文件，删除后无法恢复。</p><div className="ec-modal-actions"><button autoFocus className="ec-button ec-button-secondary" disabled={busy} onClick={() => setDeleteTarget(null)}>保留答卷</button><button className="ec-button ec-danger" disabled={busy} onClick={() => { setBusy(true); void examRepository.deleteSession(deleteTarget.id).then(() => { setDeleteTarget(null); return refresh(); }).catch(cause => setError(cause instanceof Error ? cause.message : '删除失败，请重试。')).finally(() => setBusy(false)); }}>{busy ? '正在删除…' : '删除答卷'}</button></div></section></div>}
  </div>;
}
