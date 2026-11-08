import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowLeft, Check, ChevronLeft, ChevronRight, Clock3,
  Download, File as FileIcon, Flag, Grid2X2, LoaderCircle, Save, Upload, X,
} from 'lucide-react';
import { resolveExamAsset } from '../../exam/assets';
import { getQuestionStatus, remainingMilliseconds } from '../../exam/session';
import type { ExamSession, PracticalQuestion, StoredAnswerFile } from '../../exam/types';
import { QuestionContent } from './QuestionContent';
import './exam-workspace.css';

export interface ExamWorkspaceProps {
  questions: PracticalQuestion[];
  session: ExamSession;
  files: Record<string, StoredAnswerFile>;
  saveState: 'saved' | 'saving' | 'error';
  error?: string;
  onSelectQuestion: (id: string) => void;
  onChangeText: (questionId: string, fieldId: string, value: string) => void;
  onAddFiles: (questionId: string, fieldId: string, files: File[]) => Promise<void>;
  onRemoveFile: (questionId: string, fieldId: string, fileId: string) => Promise<void>;
  onSave: () => Promise<void>;
  onToggleMark: (questionId: string) => void;
  onExit: () => void;
  onSubmit: () => Promise<void>;
}

const groupLabels: Record<string, string> = {
  '1.1': '业务流程设计',
  '1.2': '业务模块效果优化',
  '2.1': '数据处理规范制定',
  '2.2': '算法测试',
  '3.1': '智能系统监控和优化',
  '3.2': '人机交互流程设计',
  '4.1': '培训',
  '4.2': '指导',
};

const statusLabels = { empty: '未作答', partial: '作答中', complete: '已完成' };

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function clockTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((value) => String(value).padStart(2, '0')).join(':');
}

function readableDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function downloadAnswer(file: StoredAnswerFile) {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  busy?: boolean;
}

function WorkspaceDialog({ title, onClose, children, busy }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) closeRef.current();
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], select:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
      )).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <div className="ew-dialog-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <div className="ew-dialog" role="dialog" aria-modal="true" aria-labelledby="ew-dialog-title" tabIndex={-1} ref={dialogRef}>
        <div className="ew-dialog-heading">
          <h2 id="ew-dialog-title">{title}</h2>
          <button className="ew-icon-button" onClick={onClose} disabled={busy} aria-label="关闭弹窗"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ExamWorkspace({
  questions, session, files, saveState, error, onSelectQuestion,
  onChangeText, onAddFiles, onRemoveFile, onSave, onToggleMark, onExit, onSubmit,
}: ExamWorkspaceProps) {
  const [now, setNow] = useState(Date.now);
  const [mobilePanel, setMobilePanel] = useState<'question' | 'answer'>('question');
  const [dialog, setDialog] = useState<'card' | 'submit' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [busyFields, setBusyFields] = useState<string[]>([]);
  const questionPanel = useRef<HTMLDivElement>(null);
  const answerPanel = useRef<HTMLDivElement>(null);
  const orderedQuestions = useMemo(() => {
    const byId = new Map(questions.map((question) => [question.id, question]));
    return session.questionIds.map((id) => byId.get(id)).filter((question): question is PracticalQuestion => !!question);
  }, [questions, session.questionIds]);
  const question = orderedQuestions.find((item) => item.id === session.currentQuestionId) || orderedQuestions[0];
  const questionIndex = orderedQuestions.findIndex((item) => item.id === question?.id);
  const groups = Array.from(new Set(orderedQuestions.map((item) => item.groupId)));
  const submitted = session.status === 'submitted';
  const remaining = remainingMilliseconds(session, now);
  const expired = session.mode === 'exam' && !submitted && remaining <= 0;
  const locked = submitted || expired;
  const completed = orderedQuestions.filter((item) => getQuestionStatus(item, session) === 'complete').length;
  const incomplete = orderedQuestions.filter((item) => getQuestionStatus(item, session) !== 'complete');
  const totalPoints = orderedQuestions.reduce((total, item) => total + item.points, 0);
  const isExam = session.mode === 'exam';
  const busy = busyFields.length > 0 || submitting;

  useEffect(() => {
    if (submitted) return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, [submitted, session.id]);

  useEffect(() => {
    questionPanel.current?.scrollTo({ top: 0 });
    answerPanel.current?.scrollTo({ top: 0 });
    setLocalError('');
  }, [question?.id]);

  useEffect(() => {
    if (submitted) setDialog(null);
  }, [submitted]);

  async function persist() {
    setLocalError('');
    try { await onSave(); } catch (failure) {
      setLocalError(failure instanceof Error ? failure.message : '答案未保存成功，请重试。');
    }
  }

  async function fileAction(fieldId: string, action: () => Promise<void>) {
    setLocalError('');
    setBusyFields((current) => [...current, fieldId]);
    try { await action(); } catch (failure) {
      setLocalError(failure instanceof Error ? failure.message : '文件未保存成功，请重新选择文件。');
    } finally { setBusyFields((current) => current.filter((id) => id !== fieldId)); }
  }

  async function confirmSubmit() {
    setSubmitting(true);
    setLocalError('');
    try { await onSubmit(); setDialog(null); } catch (failure) {
      setLocalError(failure instanceof Error ? failure.message : '交卷未完成，请重试。');
    } finally { setSubmitting(false); }
  }

  function questionButton(item: PracticalQuestion, inCard = false) {
    const status = getQuestionStatus(item, session);
    const marked = session.markedQuestionIds.includes(item.id);
    return (
      <button key={item.id}
        className={`ew-question-tab ${status} ${item.id === question?.id ? 'current' : ''} ${marked ? 'marked' : ''}`}
        aria-current={item.id === question?.id ? 'step' : undefined}
        aria-label={`${item.id} ${item.title}，${statusLabels[status]}${marked ? '，已标记' : ''}`}
        title={`${item.title} · ${statusLabels[status]}`}
        onClick={() => { onSelectQuestion(item.id); if (inCard) setDialog(null); }}>
        {item.id}{marked && <Flag className="ew-tab-flag" size={10} aria-hidden="true" />}
      </button>
    );
  }

  if (!question) {
    return <section className="exam-workspace ew-unavailable"><AlertCircle size={30} /><h1>无法载入这份答卷的题目</h1><p>请返回考试中心后重新打开。</p><button className="ew-button primary" onClick={onExit}>返回考试中心</button></section>;
  }

  return (
    <section className="exam-workspace" aria-label={isExam ? '实操考试工作台' : '实操练习工作台'}>
      <div className="ew-topbar">
        <button className="ew-return" onClick={onExit} disabled={submitting}><ArrowLeft size={16} />考试中心</button>
        <span className="ew-mode">{isExam ? '考试模式' : '练习模式'}</span>
        <span className={`ew-save-indicator ${saveState}`} role="status" aria-live="polite">
          {saveState === 'saving' ? <LoaderCircle size={14} className="ew-spin" /> : saveState === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          {saveState === 'saving' ? '正在保存' : saveState === 'error' ? '保存失败' : '已保存到此浏览器'}
        </span>
      </div>

      <header className="ew-header">
        <div className="ew-heading">
          <h1>人工智能训练师三级<span>操作技能{isExam ? '考核' : '练习'}</span></h1>
          <p>{submitted ? `${isExam ? '答卷' : '练习'}已提交${session.submittedAt ? ` · ${readableDate(session.submittedAt)}` : ''}` : `共 ${orderedQuestions.length} 题${isExam ? `，合计 ${totalPoints} 分` : '，不限时练习'}`}<span className="ew-heading-divider">|</span>已完成 {completed} / {orderedQuestions.length} 题</p>
        </div>
        {isExam && !submitted ? (
          <div className={`ew-timer ${remaining <= 10 * 60 * 1000 ? 'urgent' : ''}`} aria-label={`考试剩余时间 ${clockTime(remaining)}`}>
            <span><Clock3 size={16} />考试倒计时</span><strong role="timer" aria-live="off">{clockTime(remaining)}</strong>
          </div>
        ) : submitted ? <div className="ew-submitted-stamp"><Check size={19} />{session.submissionReason === 'timeout' ? '时间到，已自动交卷' : '已提交 · 只读查看'}</div>
          : <div className="ew-practice-tip"><Clock3 size={16} /><span>可随时退出，下次继续</span></div>}
      </header>

      {(error || localError || expired) && <div className="ew-notice" role="alert">
        <AlertCircle size={17} /><span>{localError || error || '考试时间已到，正在保存并提交答卷。'}</span>
        {(error || localError) && <button onClick={persist} disabled={busy}>重试保存</button>}
      </div>}

      <div className="ew-mobile-switch" aria-label="查看区域">
        <button className={mobilePanel === 'question' ? 'active' : ''} onClick={() => setMobilePanel('question')} aria-pressed={mobilePanel === 'question'}>题目与材料</button>
        <button className={mobilePanel === 'answer' ? 'active' : ''} onClick={() => setMobilePanel('answer')} aria-pressed={mobilePanel === 'answer'}>作答区</button>
      </div>

      <div className={`ew-body show-${mobilePanel}`}>
        <section className="ew-question-pane" aria-label="题目区">
          <div className="ew-question-toolbar">
            <strong>操作题 <span>第 {questionIndex + 1} / {orderedQuestions.length} 题</span></strong>
            <div className="ew-toolbar-actions">
              <a className="ew-button primary compact" href={resolveExamAsset(question.materials.zip.key)} download={`${question.id}.zip`}><Download size={15} />下载材料</a>
              <button className={`ew-button compact ${session.markedQuestionIds.includes(question.id) ? 'is-marked' : ''}`} disabled={locked} onClick={() => onToggleMark(question.id)} aria-pressed={session.markedQuestionIds.includes(question.id)}><Flag size={14} />{session.markedQuestionIds.includes(question.id) ? '已标记' : '标记'}</button>
            </div>
          </div>
          <nav className="ew-question-navigation" aria-label="题号导航">
            {!isExam && <label className="ew-group-select"><span className="ew-visually-hidden">练习章节</span><select value={question.groupId} onChange={(event) => {
              const next = orderedQuestions.find((item) => item.groupId === event.target.value);
              if (next) onSelectQuestion(next.id);
            }}>{groups.map((group) => <option key={group} value={group}>{group} {groupLabels[group] || '实操题'}</option>)}</select></label>}
            <div className="ew-question-tabs">{orderedQuestions.filter((item) => isExam || item.groupId === question.groupId).map((item) => questionButton(item))}</div>
          </nav>
          <div className="ew-question-scroll" ref={questionPanel}>
            <div className="ew-current-heading"><h2>{question.id} {question.title}</h2><p>本题 {question.points} 分<span>建议用时 {question.durationMinutes} 分钟</span><span>原题 PDF 第 {question.source.pages.join('、')} 页</span></p></div>
            <QuestionContent blocks={question.content} />
            <details className="ew-material-list"><summary>材料清单 <span>{question.materials.files.length} 个文件 · {fileSize(question.materials.zip.bytes)}</span></summary><ul>{question.materials.files.map((file) => <li key={file.key}><a href={resolveExamAsset(file.key)} download={file.name}>{file.name}</a></li>)}</ul></details>
          </div>
        </section>

        <section className="ew-answer-pane" aria-label="作答区">
          <div className="ew-answer-heading"><strong>答题区 <span>{question.answerSections.length} 个作答项目</span></strong><p>{submitted ? '已提交的答案不可修改。' : '文字自动保存，文件选择后保存在当前浏览器。'}</p></div>
          <div className="ew-answer-scroll" ref={answerPanel}>
            {question.answerSections.map((section, sectionIndex) => <section className="ew-answer-section" key={section.id} aria-labelledby={`ew-section-${question.id}-${section.id}`}>
              <h3 id={`ew-section-${question.id}-${section.id}`}>({sectionIndex + 1}) {section.title}</h3>
              {section.description && <p className="ew-field-description">{section.description}</p>}
              {section.fields.map((field) => {
                const answer = session.answers[question.id]?.[field.id];
                const inputId = `ew-answer-${question.id}-${field.id}`;
                const fieldBusy = busyFields.includes(field.id);
                return <div className={`ew-answer-field ${field.kind}`} key={field.id}>
                  <label htmlFor={inputId}>{field.label}{field.required === false && <span>（选填）</span>}</label>
                  <div className="ew-field-control">
                    {field.description && <p className="ew-field-description" id={`${inputId}-description`}>{field.description}</p>}
                    {field.kind === 'text' ? <textarea id={inputId} value={answer?.text || ''} placeholder={submitted ? '未填写' : field.placeholder || `请填写${field.label}`} rows={4} readOnly={locked} aria-describedby={field.description ? `${inputId}-description` : undefined} onChange={(event) => onChangeText(question.id, field.id, event.target.value)} />
                      : <>
                        {!locked && <label className={`ew-file-picker ${fieldBusy ? 'busy' : ''}`} htmlFor={inputId}>
                          {fieldBusy ? <LoaderCircle size={15} className="ew-spin" /> : <Upload size={15} />}
                          {fieldBusy ? '正在保存文件' : !field.multiple && (answer?.fileIds.length || 0) > 0 ? '替换文件' : field.multiple ? '选择文件（可多选）' : '选择文件'}
                          <input id={inputId} type="file" accept={field.accept} multiple={field.multiple} disabled={fieldBusy || locked} onChange={(event) => {
                            const selected = Array.from(event.target.files || []);
                            event.target.value = '';
                            if (selected.length > 0) void fileAction(field.id, () => onAddFiles(question.id, field.id, selected));
                          }} />
                        </label>}
                        {field.expectedNames && field.expectedNames.length > 0 && <p className="ew-file-hint">文件命名：{field.expectedNames.join('、')}</p>}
                        {(!field.expectedNames || field.expectedNames.length === 0) && field.accept && <p className="ew-file-hint">文件格式：{field.accept.replace(/,/g, '、')}</p>}
                        {(answer?.fileIds || []).length > 0 ? <ul className="ew-uploaded-files">{(answer?.fileIds || []).map((fileId) => {
                          const file = files[fileId];
                          return <li key={fileId}><FileIcon size={16} /><div>{file ? <button className="ew-file-name" onClick={() => downloadAnswer(file)} title="下载已保存的作答文件">{file.name}</button> : <span>正在读取已保存的文件…</span>}<small>{file ? fileSize(file.size) : '文件记录已保存'}</small></div>{file && <button className="ew-icon-button" onClick={() => downloadAnswer(file)} aria-label={`下载 ${file.name}`}><Download size={15} /></button>}{!locked && <button className="ew-icon-button" disabled={fieldBusy} aria-label={`移除 ${file?.name || '文件'}`} onClick={() => void fileAction(field.id, () => onRemoveFile(question.id, field.id, fileId))}><X size={15} /></button>}</li>;
                        })}</ul> : submitted && <p className="ew-empty-answer">未提交文件</p>}
                      </>}
                  </div>
                </div>;
              })}
              {!locked && <div className="ew-section-actions"><button className="ew-button primary" onClick={persist} disabled={busy || saveState === 'saving'}><Save size={14} />保存答案</button></div>}
            </section>)}
          </div>
        </section>
      </div>

      <footer className="ew-footer">
        <button className="ew-button" onClick={() => setDialog('card')}><Grid2X2 size={16} />答题卡<span className="ew-footer-progress">{completed}/{orderedQuestions.length}</span></button>
        <div className="ew-pagination"><button className="ew-button" disabled={questionIndex <= 0} onClick={() => onSelectQuestion(orderedQuestions[questionIndex - 1].id)}><ChevronLeft size={16} />上一题</button><button className="ew-button" disabled={questionIndex === orderedQuestions.length - 1} onClick={() => onSelectQuestion(orderedQuestions[questionIndex + 1].id)}>下一题<ChevronRight size={16} /></button></div>
        {submitted ? <button className="ew-button primary" onClick={onExit}>返回考试中心</button> : <button className="ew-button primary" disabled={locked || busy} onClick={() => setDialog('submit')}>{isExam ? '交卷' : '结束练习'}</button>}
      </footer>

      {dialog && <WorkspaceDialog title={dialog === 'card' ? '答题卡' : isExam ? '确认交卷' : '结束本次练习'} onClose={() => setDialog(null)} busy={submitting}>
        {dialog === 'card' ? <>
          <p className="ew-dialog-description">已完成 {completed} / {orderedQuestions.length} 题。状态仅表示作答项目是否填写完整。</p>
          <div className="ew-card-legend"><span><i className="empty" />未作答</span><span><i className="partial" />作答中</span><span><i className="complete" />已完成</span><span><Flag size={12} />已标记</span></div>
          <div className="ew-card-groups">{groups.map((group) => <div key={group}><h3>{group} {groupLabels[group]}</h3><div className="ew-question-tabs">{orderedQuestions.filter((item) => item.groupId === group).map((item) => questionButton(item, true))}</div></div>)}</div>
          <div className="ew-dialog-actions"><button className="ew-button" onClick={() => setDialog(null)}>返回答卷</button>{!submitted && <button className="ew-button primary" disabled={locked || busy} onClick={() => setDialog('submit')}>{isExam ? '交卷' : '结束练习'}</button>}</div>
        </> : <>
          <p className="ew-dialog-description">{incomplete.length > 0 ? `还有 ${incomplete.length} 题未完整作答。` : `全部 ${orderedQuestions.length} 题的作答项目已填写。`}提交后，当前答卷将保存为只读记录。</p>
          {incomplete.length > 0 && <div className="ew-incomplete-list"><strong>未完整作答的题目</strong><div>{incomplete.map((item) => <button key={item.id} onClick={() => { onSelectQuestion(item.id); setDialog(null); }}>{item.id}</button>)}</div></div>}
          {session.markedQuestionIds.length > 0 && <p className="ew-dialog-description">你还标记了 {session.markedQuestionIds.length} 题待检查。</p>}
          {localError && <p className="ew-dialog-error" role="alert">{localError}</p>}
          <div className="ew-dialog-actions"><button className="ew-button" onClick={() => setDialog(null)} disabled={submitting}>继续作答</button><button className="ew-button primary" onClick={() => void confirmSubmit()} disabled={submitting || busyFields.length > 0}>{submitting && <LoaderCircle size={15} className="ew-spin" />}{submitting ? '正在提交' : isExam ? '确认交卷' : '确认结束练习'}</button></div>
        </>}
      </WorkspaceDialog>}
    </section>
  );
}
