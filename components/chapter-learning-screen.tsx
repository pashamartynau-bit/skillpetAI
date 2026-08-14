"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  Lightbulb,
  Lock,
  MessageSquareQuote,
  Sparkles,
  XCircle,
  Loader2,
} from "lucide-react";

import { ChapterMarkdown } from "@/components/chapter-markdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  buildChapterProgressKey,
  completeChapterWithRewards,
  consumeHeart,
  getChapterProgressRecord,
  readLearningWallet,
  saveChapterProgress,
  subscribeToLearningProgress,
  type LearningRewardSnapshot,
} from "@/lib/learning-progress";
import type {
  ChapterContentBlockRecord,
  ChapterChoiceRecord,
  CourseChapterRecord,
  CourseRecord,
  MatchingPairRecord,
} from "@/lib/strapi-courses";
import { cn } from "@/lib/utils";

type ChapterLearningScreenProps = {
  chapter: CourseChapterRecord;
  chapterIndex: number;
  course: CourseRecord;
};

type FeedbackState =
  | {
      message: string;
      title: string;
      variant: "destructive" | "success" | "warning";
    }
  | null;

type ScreenState = "complete" | "content" | "intro";

export function ChapterLearningScreen({
  chapter,
  chapterIndex,
  course,
}: ChapterLearningScreenProps) {
  const chapterKey = buildChapterProgressKey(course.id, chapter.id);
  const savedChapterProgress = getChapterProgressRecord(chapterKey);
  const maxContentIndex = Math.max(chapter.contentBlocks.length - 1, 0);
  const initialIndex = savedChapterProgress?.completedAt
    ? chapter.contentBlocks.length
    : Math.min(savedChapterProgress?.activeContentIndex ?? 0, maxContentIndex);
  const initialBlock = chapter.contentBlocks[initialIndex] ?? null;
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [wallet, setWallet] = useState(readLearningWallet());
  const [rewardSnapshot, setRewardSnapshot] = useState<LearningRewardSnapshot | null>(null);
  const [earnedGemItemKeys, setEarnedGemItemKeys] = useState(
    savedChapterProgress?.earnedGemItemKeys ?? [],
  );
  const [incorrectAttemptItemKeys, setIncorrectAttemptItemKeys] = useState(
    savedChapterProgress?.incorrectAttemptItemKeys ?? [],
  );
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [fillBlankValue, setFillBlankValue] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [matchingOptionOrder, setMatchingOptionOrder] = useState<MatchingPairRecord[]>(
    initialBlock?.type === "matching" ? shufflePairs(initialBlock.pairs) : [],
  );

  const currentBlock = chapter.contentBlocks[currentIndex] ?? null;
  const isComplete = currentIndex >= chapter.contentBlocks.length;
  const chapterProgressPercent =
    chapter.contentBlocks.length > 0
      ? Math.round((Math.min(currentIndex, chapter.contentBlocks.length) / chapter.contentBlocks.length) * 100)
      : 100;

  useEffect(() => {
    const introTimer = window.setTimeout(() => {
      startTransition(() => {
        setScreen(savedChapterProgress?.completedAt ? "complete" : "content");
      });
    }, 2200);

    return () => {
      window.clearTimeout(introTimer);
    };
  }, [savedChapterProgress?.completedAt]);

  useEffect(() => {
    const syncWallet = () => {
      setWallet(readLearningWallet());
    };

    syncWallet();
    return subscribeToLearningProgress(syncWallet);
  }, []);

  useEffect(() => {
    const syncChapterProgress = () => {
      const nextProgress = getChapterProgressRecord(chapterKey);
      const nextIndex = nextProgress?.completedAt
        ? chapter.contentBlocks.length
        : Math.min(nextProgress?.activeContentIndex ?? 0, maxContentIndex);
      const nextBlock = chapter.contentBlocks[nextIndex] ?? null;

      if (nextIndex !== currentIndex) {
        setFeedback(null);
        setHintMessage(null);
        setSelectedChoiceId(null);
        setFillBlankValue("");
        setCodeAnswer("");
        setMatchingSelections({});
        setMatchingOptionOrder(
          nextBlock?.type === "matching" ? shufflePairs(nextBlock.pairs) : [],
        );
      }

      setCurrentIndex(nextIndex);
      setEarnedGemItemKeys(nextProgress?.earnedGemItemKeys ?? []);
      setIncorrectAttemptItemKeys(nextProgress?.incorrectAttemptItemKeys ?? []);

      if (nextProgress?.completedAt) {
        setScreen("complete");
      }
    };

    syncChapterProgress();
    return subscribeToLearningProgress(syncChapterProgress);
  }, [chapter.contentBlocks, chapterKey, currentIndex, maxContentIndex]);

  const canContinue = getCanContinue(currentBlock, feedback, isComplete);

  function resetBlockState(nextBlock: ChapterContentBlockRecord | null = null) {
    setFeedback(null);
    setHintMessage(null);
    setSelectedChoiceId(null);
    setFillBlankValue("");
    setCodeAnswer("");
    setMatchingSelections({});
    setMatchingOptionOrder(nextBlock?.type === "matching" ? shufflePairs(nextBlock.pairs) : []);
  }

  function setSuccessFeedback(title: string, message: string) {
    setFeedback({
      message,
      title,
      variant: "success",
    });
  }

  function setErrorFeedback(title: string, message: string) {
    setFeedback({
      message,
      title,
      variant: "destructive",
    });
  }

  function markIncorrectAttempt(itemKey: string) {
    if (incorrectAttemptItemKeys.includes(itemKey)) {
      return;
    }

    const nextIncorrectAttempts = [...incorrectAttemptItemKeys, itemKey];
    setIncorrectAttemptItemKeys(nextIncorrectAttempts);
  }

  function markGemEarned(itemKey: string) {
    if (earnedGemItemKeys.includes(itemKey) || incorrectAttemptItemKeys.includes(itemKey)) {
      return;
    }

    const nextEarnedGems = [...earnedGemItemKeys, itemKey];
    setEarnedGemItemKeys(nextEarnedGems);
  }

  function handleChoiceSelection(choice: ChapterChoiceRecord) {
    if (!currentBlock || currentBlock.type !== "multiple-choice") {
      return;
    }

    setSelectedChoiceId(choice.id);

    if (choice.isCorrect) {
      markGemEarned(currentBlock.id);
      setSuccessFeedback(
        "Correct answer",
        choice.explanation || currentBlock.correctFeedback,
      );
      return;
    }

    markIncorrectAttempt(currentBlock.id);
    setErrorFeedback(
      "Not quite",
      choice.explanation || currentBlock.incorrectFeedback,
    );
  }

  function handleFillBlankSubmit() {
    if (!currentBlock || currentBlock.type !== "fill-in-the-blank") {
      return;
    }

    const selectedOption = currentBlock.options.find(
      (option) => normalizeAnswer(option.text) === normalizeAnswer(fillBlankValue),
    );

    if (!selectedOption) {
      setErrorFeedback("Choose an answer", "Select one of the provided options first.");
      return;
    }

    const normalizedValue = normalizeAnswer(fillBlankValue);
    const isCorrect = currentBlock.acceptedAnswers.some(
      (answer) => normalizeAnswer(answer) === normalizedValue,
    );

    if (isCorrect) {
      markGemEarned(currentBlock.id);
      setSuccessFeedback(
        "Correct answer",
        selectedOption.explanation || currentBlock.correctFeedback,
      );
      return;
    }

    markIncorrectAttempt(currentBlock.id);
    setErrorFeedback("Try again", selectedOption.explanation || currentBlock.incorrectFeedback);
  }

  function handleBooleanAnswer(answer: boolean) {
    if (!currentBlock || (currentBlock.type !== "true-false" && currentBlock.type !== "yes-no")) {
      return;
    }

    if (answer === currentBlock.correctAnswer) {
      markGemEarned(currentBlock.id);
      setSuccessFeedback("Correct answer", currentBlock.correctFeedback);
      return;
    }

    markIncorrectAttempt(currentBlock.id);
    setErrorFeedback("Not quite", currentBlock.incorrectFeedback);
  }

  function handleMatchingSubmit() {
    if (!currentBlock || currentBlock.type !== "matching") {
      return;
    }

    if (currentBlock.mode === "options") {
      return;
    }

    const isCorrect = currentBlock.pairs.every(
      (pair) => matchingSelections[pair.id] === pair.right,
    );

    if (isCorrect) {
      markGemEarned(currentBlock.id);
      setSuccessFeedback("Correct answer", currentBlock.correctFeedback);
      return;
    }

    markIncorrectAttempt(currentBlock.id);
    setErrorFeedback("Try again", currentBlock.incorrectFeedback);
  }

  function handleMatchingChoiceSelection(choice: ChapterChoiceRecord) {
    if (!currentBlock || currentBlock.type !== "matching" || currentBlock.mode !== "options") {
      return;
    }

    setSelectedChoiceId(choice.id);

    if (choice.isCorrect) {
      markGemEarned(currentBlock.id);
      setSuccessFeedback(
        "Correct answer",
        choice.explanation || currentBlock.correctFeedback,
      );
      return;
    }

    markIncorrectAttempt(currentBlock.id);
    setErrorFeedback(
      "Not quite",
      choice.explanation || currentBlock.incorrectFeedback,
    );
  }

  function handleCodeExerciseSubmit() {
    if (!currentBlock || currentBlock.type !== "code-exercise") {
      return;
    }

    if (normalizeAnswer(codeAnswer) === normalizeAnswer(currentBlock.expectedAnswer)) {
      markGemEarned(currentBlock.id);
      setSuccessFeedback("Correct answer", currentBlock.successFeedback);
      return;
    }

    markIncorrectAttempt(currentBlock.id);
    setErrorFeedback("Try again", currentBlock.failureFeedback);
  }

  async function handleUseHint() {
    try {
      if (!currentBlock) {
        return;
      }

      if (!(await consumeHeart())) {
        setFeedback({
          message: "You have no hearts left for hints right now.",
          title: "No hearts available",
          variant: "warning",
        });
        return;
      }

      const message = getHintMessage(currentBlock);
      setHintMessage(message);
    } catch (error) {
      console.error("Failed to use heart:", error);
      setErrorFeedback("Unable to use heart", "Please try again.");
    }
  }

  async function handleContinue() {
    try {
      if (screen !== "content") {
        return;
      }

      const nextIndex = currentIndex + 1;

      if (nextIndex >= chapter.contentBlocks.length) {
        setIsSaving(true);
        try {
          const nextRewardSnapshot = await completeChapterWithRewards({
            chapterKey,
            completedChapterIndex: chapterIndex,
            courseId: course.id,
            earnedGemItemKeys,
            incorrectAttemptItemKeys,
            nextActiveContentIndex: nextIndex,
            totalChapterCount: course.chapters.length,
          });
          setRewardSnapshot(nextRewardSnapshot);
          setScreen("complete");
        } catch (error) {
          console.error("Failed to complete chapter:", error);
          setErrorFeedback("Chapter completion failed", "Please try again to claim your rewards.");
        } finally {
          setIsSaving(false);
        }
        return;
      }

      setIsSaving(true);
      try {
        await saveChapterProgress(chapterKey, {
          activeContentIndex: nextIndex,
          earnedGemItemKeys,
          incorrectAttemptItemKeys,
        });
        resetBlockState(chapter.contentBlocks[nextIndex] ?? null);
        setCurrentIndex(nextIndex);
      } catch (error) {
        console.error("Failed to save progress:", error);
        setErrorFeedback("Saving failed", "Please try again.");
      } finally {
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Unexpected error in handleContinue:", error);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fbfff7_0%,#eef6e8_35%,#e6f0df_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 shadow-[0_34px_120px_-62px_rgba(34,46,84,0.42)] backdrop-blur">
        {screen === "intro" ? (
          <IntroStage chapter={chapter} />
        ) : screen === "complete" ? (
          <CompletionStage
            chapter={chapter}
            courseHref={course.href}
            rewardSnapshot={rewardSnapshot}
            wallet={wallet}
          />
        ) : (
          <>
            <header className="border-b border-[#e8edf5] px-5 py-4 sm:px-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    render={<Link href={course.href} />}
                    variant="ghost"
                    className="h-12 w-12 rounded-full border border-[#dfe6f2] bg-white text-[#203057] shadow-[0_18px_34px_-30px_rgba(34,46,84,0.6)] hover:bg-[#f7faff]"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </Button>

                  <div>
                    <p className="text-sm font-semibold text-[#27a844]">
                      Chapter {chapter.chapterNumber ?? chapterIndex + 1}
                    </p>
                    <h1 className="text-[1.2rem] font-semibold tracking-[-0.04em] text-[#16214d] sm:text-[1.35rem]">
                      {chapter.name}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-4 lg:max-w-[620px]">
                  <div className="min-w-0 flex-1">
                    <Progress value={chapterProgressPercent} className="gap-2">
                      <ProgressTrack className="h-4 rounded-full bg-[#edf1f6]">
                        <ProgressIndicator className="rounded-full bg-[linear-gradient(90deg,#19b249_0%,#2fcf62_100%)] transition-[width] duration-500" />
                      </ProgressTrack>
                    </Progress>
                  </div>
                  <span className="min-w-[52px] text-right text-xl font-semibold text-[#445376]">
                    {chapterProgressPercent}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <StatPill
                    icon={<GemIcon className="h-5 w-5" />}
                    tone="green"
                    value={wallet.gems}
                  />
                  <StatPill
                    icon={<Heart className="h-5 w-5 fill-current" />}
                    tone="pink"
                    value={wallet.hearts}
                  />
                </div>
              </div>
            </header>

            <section className="flex flex-1 flex-col justify-between">
              <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
                <div className="w-full max-w-4xl">
                  {currentBlock ? (
                    <ContentBlockCard
                      block={currentBlock}
                      codeAnswer={codeAnswer}
                      fillBlankValue={fillBlankValue}
                      hintMessage={hintMessage}
                      matchingOptionOrder={matchingOptionOrder}
                      matchingSelections={matchingSelections}
                      onBooleanAnswer={handleBooleanAnswer}
                      onChoiceSelect={handleChoiceSelection}
                      onCodeAnswerChange={setCodeAnswer}
                      onCodeSubmit={handleCodeExerciseSubmit}
                      onFillBlankChange={setFillBlankValue}
                      onFillBlankSubmit={handleFillBlankSubmit}
                      onMatchingChange={(pairId, value) =>
                        setMatchingSelections((current) => ({
                          ...current,
                          [pairId]: value,
                        }))
                      }
                      onMatchingChoiceSelect={handleMatchingChoiceSelection}
                      onMatchingSubmit={handleMatchingSubmit}
                      selectedChoiceId={selectedChoiceId}
                    />
                  ) : (
                    <NoContentNotice chapterName={chapter.name} />
                  )}
                </div>
              </div>

              <footer className="border-t border-[#e8edf5] bg-white/94 px-4 py-4 sm:px-6">
                {feedback ? (
                  <Alert
                    variant={feedback.variant === "destructive" ? "destructive" : "default"}
                    className={cn(
                      "mb-4 rounded-[1.4rem] border px-5 py-4 shadow-[0_20px_40px_-34px_rgba(34,46,84,0.42)]",
                      feedback.variant === "success" &&
                        "border-[#bde8c6] bg-[linear-gradient(135deg,rgba(237,251,241,0.96),rgba(248,255,250,0.98))] text-[#166534]",
                      feedback.variant === "warning" &&
                        "border-[#f8d9b0] bg-[linear-gradient(135deg,rgba(255,247,234,0.97),rgba(255,252,246,0.98))] text-[#8a4b17]",
                    )}
                  >
                    {feedback.variant === "destructive" ? (
                      <XCircle className="h-5 w-5" />
                    ) : feedback.variant === "warning" ? (
                      <Lightbulb className="h-5 w-5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    <AlertTitle className="text-base">{feedback.title}</AlertTitle>
                    <AlertDescription className="text-sm leading-6 text-current/85">
                      {feedback.message}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isHintDisabled(currentBlock, wallet.hearts)}
                    onClick={() => void handleUseHint()}
                    className="h-16 rounded-[1.35rem] border-[#d8e0ec] bg-white px-6 text-lg font-semibold text-[#31527b] shadow-[0_24px_50px_-40px_rgba(34,46,84,0.45)] hover:bg-[#f8fbff] sm:min-w-[180px]"
                  >
                    <Lightbulb className="h-5 w-5 text-[#2fb24a]" />
                    Use Heart
                  </Button>

                  <Button
                    type="button"
                    disabled={!canContinue || isSaving}
                    onClick={() => void handleContinue()}
                    className="h-16 flex-1 rounded-[1.5rem] bg-[linear-gradient(90deg,#1fb74d_0%,#22c55e_100%)] px-7 text-xl font-semibold text-white shadow-[0_28px_54px_-32px_rgba(34,197,94,0.92)] hover:opacity-95 disabled:bg-[#c7d3df] disabled:text-white sm:max-w-[68%]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-auto h-6 w-6" />
                      </>
                    )}
                  </Button>
                </div>
              </footer>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function IntroStage({ chapter }: { chapter: CourseChapterRecord }) {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="animate-[chapterIntro_2.2s_ease-in-out_forwards] text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.36em] text-[#25a53a] sm:text-base">
          Chapter
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.08em] text-[#16214d] sm:text-[4.6rem]">
          {chapter.name}
        </h1>
      </div>
    </section>
  );
}

function CompletionStage({
  chapter,
  courseHref,
  rewardSnapshot,
  wallet,
}: {
  chapter: CourseChapterRecord;
  courseHref: string;
  rewardSnapshot: LearningRewardSnapshot | null;
  wallet: ReturnType<typeof readLearningWallet>;
}) {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl text-center animate-[completionRise_640ms_ease-out]">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#f6ffe6_0%,#d8f6a5_100%)] text-[#28a745] shadow-[0_28px_68px_-34px_rgba(47,178,74,0.55)]">
          <Sparkles className="h-12 w-12" />
        </div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.34em] text-[#29a745]">
          Chapter Complete
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.08em] text-[#16214d] sm:text-[4rem]">
          {chapter.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#5b6d90]">
          You finished this chapter and locked in your rewards. Keep moving to the
          next chapter to build your streak and collect more gems.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <RewardCard
            accent="green"
            icon={<GemIcon className="h-10 w-10" />}
            label="Gems earned"
            value={`+${rewardSnapshot?.gemDelta ?? 0}`}
          />
          <RewardCard
            accent="pink"
            icon={<Heart className="h-10 w-10 fill-current" />}
            label="Hearts earned"
            value={`+${rewardSnapshot?.heartDelta ?? 1}`}
          />
          <RewardCard
            accent="orange"
            icon={
              <Image
                src="/streak.png"
                alt="Streak icon"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            }
            label="Daily streak"
            value={rewardSnapshot?.dailyStreakAwarded ? "+1" : "0"}
            sublabel={rewardSnapshot?.dailyStreakAwarded ? "First chapter finished today" : "Already awarded today"}
          />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 rounded-[1.6rem] border border-[#e6ecf5] bg-white/88 px-6 py-5 text-left shadow-[0_22px_52px_-44px_rgba(34,46,84,0.45)] sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8794b0]">
              Totals
            </p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.04em] text-[#16214d]">
              {wallet.gems} gems and {wallet.hearts} hearts available
            </p>
          </div>

          <Button
            render={<Link href={courseHref} />}
            className="h-14 rounded-[1.3rem] bg-[linear-gradient(90deg,#1fb74d_0%,#22c55e_100%)] px-6 text-lg font-semibold text-white shadow-[0_24px_54px_-34px_rgba(34,197,94,0.92)] hover:opacity-95"
          >
            Back to Course
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function ContentBlockCard({
  block,
  codeAnswer,
  fillBlankValue,
  hintMessage,
  matchingOptionOrder,
  matchingSelections,
  onBooleanAnswer,
  onChoiceSelect,
  onCodeAnswerChange,
  onCodeSubmit,
  onFillBlankChange,
  onFillBlankSubmit,
  onMatchingChange,
  onMatchingChoiceSelect,
  onMatchingSubmit,
  selectedChoiceId,
}: {
  block: ChapterContentBlockRecord;
  codeAnswer: string;
  fillBlankValue: string;
  hintMessage: string | null;
  matchingOptionOrder: MatchingPairRecord[];
  matchingSelections: Record<string, string>;
  onBooleanAnswer: (answer: boolean) => void;
  onChoiceSelect: (choice: ChapterChoiceRecord) => void;
  onCodeAnswerChange: (value: string) => void;
  onCodeSubmit: () => void;
  onFillBlankChange: (value: string) => void;
  onFillBlankSubmit: () => void;
  onMatchingChange: (pairId: string, value: string) => void;
  onMatchingChoiceSelect: (choice: ChapterChoiceRecord) => void;
  onMatchingSubmit: () => void;
  selectedChoiceId: string | null;
}) {
  return (
    <article className="rounded-[2rem] border border-[#e6ebf4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,255,0.94))] p-5 shadow-[0_30px_90px_-64px_rgba(34,46,84,0.5)] sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#effcf3_0%,#d9f3df_100%)] text-[#2db24a]">
          <MessageSquareQuote className="h-8 w-8" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8b97b0]">
            Topic
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#16214d] sm:text-[2rem]">
            {block.title}
          </h2>
        </div>
      </div>

      <div className="mt-8">
        {hintMessage ? (
          <div className="mb-5 rounded-[1.25rem] border border-[#f2dfb9] bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(255,252,247,0.98))] px-5 py-4 text-sm leading-7 text-[#8a5a20]">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" />
              <span>{hintMessage}</span>
            </div>
          </div>
        ) : null}
        {renderBlockBody({
          block,
          codeAnswer,
          fillBlankValue,
          matchingOptionOrder,
          matchingSelections,
          onBooleanAnswer,
          onChoiceSelect,
          onCodeAnswerChange,
          onCodeSubmit,
          onFillBlankChange,
          onFillBlankSubmit,
          onMatchingChange,
          onMatchingChoiceSelect,
          onMatchingSubmit,
          selectedChoiceId,
        })}
      </div>
    </article>
  );
}

function renderBlockBody({
  block,
  codeAnswer,
  fillBlankValue,
  matchingOptionOrder,
  matchingSelections,
  onBooleanAnswer,
  onChoiceSelect,
  onCodeAnswerChange,
  onCodeSubmit,
  onFillBlankChange,
  onFillBlankSubmit,
  onMatchingChange,
  onMatchingChoiceSelect,
  onMatchingSubmit,
  selectedChoiceId,
}: {
  block: ChapterContentBlockRecord;
  codeAnswer: string;
  fillBlankValue: string;
  matchingOptionOrder: MatchingPairRecord[];
  matchingSelections: Record<string, string>;
  onBooleanAnswer: (answer: boolean) => void;
  onChoiceSelect: (choice: ChapterChoiceRecord) => void;
  onCodeAnswerChange: (value: string) => void;
  onCodeSubmit: () => void;
  onFillBlankChange: (value: string) => void;
  onFillBlankSubmit: () => void;
  onMatchingChange: (pairId: string, value: string) => void;
  onMatchingChoiceSelect: (choice: ChapterChoiceRecord) => void;
  onMatchingSubmit: () => void;
  selectedChoiceId: string | null;
}) {
  if (block.type === "theory") {
    return <ChapterMarkdown content={block.bodyMarkdown} />;
  }

  if (block.type === "multiple-choice") {
    if (block.malformed) {
      return <MalformedBlockNotice block={block} />;
    }

    return (
      <div>
        <p className="text-center text-[1.55rem] font-medium tracking-[-0.04em] text-[#445376]">
          {block.question}
        </p>
        <div className="mx-auto mt-8 max-w-3xl space-y-4">
          {block.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoiceSelect(choice)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-[1.35rem] border px-5 py-5 text-left transition-all",
                  isSelected
                    ? "border-[#2fb24a] bg-[linear-gradient(135deg,rgba(238,255,241,0.95),rgba(247,255,249,0.98))] shadow-[0_22px_48px_-38px_rgba(47,178,74,0.7)]"
                    : "border-[#dfe6f2] bg-white hover:border-[#c8d7ea] hover:bg-[#fbfdff]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected
                      ? "border-[#2fb24a] text-[#2fb24a]"
                      : "border-[#c9d3e3] text-transparent",
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-current" />
                </span>
                <span className="text-xl leading-8 text-[#1f2f50]">{choice.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "fill-in-the-blank") {
    if (block.malformed) {
      return <MalformedBlockNotice block={block} />;
    }

    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-[1.5rem] font-medium tracking-[-0.04em] text-[#445376]">
          {block.prompt}
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <select
            value={fillBlankValue}
            onChange={(event) => onFillBlankChange(event.target.value)}
            className="h-14 flex-1 rounded-[1.2rem] border border-[#dfe6f2] bg-white px-5 text-lg text-[#1f2f50] shadow-[0_20px_48px_-38px_rgba(34,46,84,0.4)] outline-none transition-all focus:border-[#7aa6e6] focus:ring-3 focus:ring-[#d6e8ff]"
          >
            <option value="">Choose the correct word</option>
            {block.options.map((option) => (
              <option key={option.id} value={option.text}>
                {option.text}
              </option>
            ))}
          </select>
          <Button
            type="button"
            onClick={onFillBlankSubmit}
            disabled={!fillBlankValue}
            className="h-14 rounded-[1.2rem] bg-[#eff7ff] px-6 text-lg font-semibold text-[#2d5c9c] hover:bg-[#e5f0fd]"
          >
            Check Answer
          </Button>
        </div>
      </div>
    );
  }

  if (block.type === "true-false") {
    if (block.malformed) {
      return <MalformedBlockNotice block={block} />;
    }

    return (
      <BooleanChoiceBlock
        prompt={block.statement}
        falseLabel="False"
        trueLabel="True"
        onAnswer={onBooleanAnswer}
      />
    );
  }

  if (block.type === "yes-no") {
    if (block.malformed) {
      return <MalformedBlockNotice block={block} />;
    }

    return (
      <BooleanChoiceBlock
        prompt={block.question}
        falseLabel="No"
        trueLabel="Yes"
        onAnswer={onBooleanAnswer}
      />
    );
  }

  if (block.type === "matching") {
    if (block.malformed) {
      return <MalformedBlockNotice block={block} />;
    }

    if (block.mode === "options") {
      return (
        <div className="mx-auto max-w-3xl">
          {block.scenario ? (
            <p className="rounded-[1.2rem] bg-[#f5f8fc] px-5 py-4 text-sm leading-7 text-[#577095]">
              {block.scenario}
            </p>
          ) : null}
          <p className="mt-5 text-center text-[1.5rem] font-medium tracking-[-0.04em] text-[#445376]">
            {block.question}
          </p>
          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            {block.options.map((choice) => {
              const isSelected = selectedChoiceId === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onMatchingChoiceSelect(choice)}
                  className={cn(
                    "flex w-full items-start gap-4 rounded-[1.35rem] border px-5 py-5 text-left transition-all",
                    isSelected
                      ? "border-[#2fb24a] bg-[linear-gradient(135deg,rgba(238,255,241,0.95),rgba(247,255,249,0.98))] shadow-[0_22px_48px_-38px_rgba(47,178,74,0.7)]"
                      : "border-[#dfe6f2] bg-white hover:border-[#c8d7ea] hover:bg-[#fbfdff]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-[#2fb24a] text-[#2fb24a]"
                        : "border-[#c9d3e3] text-transparent",
                    )}
                  >
                    <span className="h-4 w-4 rounded-full bg-current" />
                  </span>
                  <span className="text-xl leading-8 text-[#1f2f50]">{choice.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl">
        {block.scenario ? (
          <p className="rounded-[1.2rem] bg-[#f5f8fc] px-5 py-4 text-sm leading-7 text-[#577095]">
            {block.scenario}
          </p>
        ) : null}
        <p className="mt-5 text-center text-[1.5rem] font-medium tracking-[-0.04em] text-[#445376]">
          {block.question}
        </p>

        <div className="mt-8 space-y-4">
          {block.pairs.map((pair) => (
            <div
              key={pair.id}
              className="grid gap-4 rounded-[1.25rem] border border-[#e1e8f3] bg-white px-5 py-4 shadow-[0_18px_42px_-36px_rgba(34,46,84,0.4)] sm:grid-cols-[minmax(0,1fr)_220px]"
            >
              <div className="text-lg font-medium text-[#1f2f50]">{pair.left}</div>
              <select
                value={matchingSelections[pair.id] ?? ""}
                onChange={(event) => onMatchingChange(pair.id, event.target.value)}
                className="h-12 rounded-xl border border-[#dbe4f0] bg-[#fbfdff] px-4 text-[#31486e] outline-none transition-all focus:border-[#7aa6e6] focus:ring-3 focus:ring-[#d6e8ff]"
              >
                <option value="">Choose a match</option>
                {matchingOptionOrder.map((option) => (
                  <option key={`${pair.id}-${option.id}`} value={option.right}>
                    {option.right}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={onMatchingSubmit}
          className="mt-6 h-14 rounded-[1.2rem] bg-[#eff7ff] px-6 text-lg font-semibold text-[#2d5c9c] hover:bg-[#e5f0fd]"
        >
          Check Matches
        </Button>
      </div>
    );
  }

  if (block.type === "code-exercise") {
    if (block.malformed) {
      return <MalformedBlockNotice block={block} />;
    }

    return (
      <div className="mx-auto max-w-3xl">
        {block.theoryMarkdown ? (
          <div className="rounded-[1.3rem] border border-[#e3e9f3] bg-[#fbfdff] px-5 py-4">
            <ChapterMarkdown content={block.theoryMarkdown} />
          </div>
        ) : null}

        {block.codeSnippet ? (
          <pre className="mt-5 overflow-x-auto rounded-[1.4rem] bg-[#0f1728] px-5 py-4 text-sm leading-7 text-[#dbe8ff] shadow-[0_28px_52px_-36px_rgba(15,23,40,0.55)]">
            <code>{block.codeSnippet}</code>
          </pre>
        ) : null}

        <p className="mt-6 text-[1.2rem] font-medium text-[#31486e]">{block.taskPrompt}</p>

        <Textarea
          value={codeAnswer}
          onChange={(event) => onCodeAnswerChange(event.target.value)}
          placeholder={block.placeholderAnswer || "Write your answer here"}
          className="mt-5 min-h-[180px] rounded-[1.3rem] border-[#dfe6f2] bg-white px-5 py-4 text-base leading-7 shadow-[0_20px_48px_-38px_rgba(34,46,84,0.4)]"
        />

        <Button
          type="button"
          onClick={onCodeSubmit}
          className="mt-5 h-14 rounded-[1.2rem] bg-[#eff7ff] px-6 text-lg font-semibold text-[#2d5c9c] hover:bg-[#e5f0fd]"
        >
          Check Answer
        </Button>
      </div>
    );
  }

  return <MalformedBlockNotice block={block} />;
}

function BooleanChoiceBlock({
  falseLabel,
  onAnswer,
  prompt,
  trueLabel,
}: {
  falseLabel: string;
  onAnswer: (answer: boolean) => void;
  prompt: string;
  trueLabel: string;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-center text-[1.5rem] font-medium tracking-[-0.04em] text-[#445376]">
        {prompt}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="rounded-[1.35rem] border border-[#dfe6f2] bg-white px-5 py-6 text-xl font-semibold text-[#1f2f50] shadow-[0_18px_42px_-36px_rgba(34,46,84,0.4)] transition-all hover:border-[#addbb5] hover:bg-[#f8fff9]"
        >
          {trueLabel}
        </button>
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="rounded-[1.35rem] border border-[#dfe6f2] bg-white px-5 py-6 text-xl font-semibold text-[#1f2f50] shadow-[0_18px_42px_-36px_rgba(34,46,84,0.4)] transition-all hover:border-[#addbb5] hover:bg-[#f8fff9]"
        >
          {falseLabel}
        </button>
      </div>
    </div>
  );
}

function MalformedBlockNotice({ block }: { block: ChapterContentBlockRecord }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-[#d6e0ef] bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.98))] px-5 py-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f6fb] text-[#7183a6]">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-[-0.03em] text-[#203057]">
            This content needs to be completed in Strapi
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5f7194]">
            SkillPet can render the <strong>{block.type}</strong> block type, but the
            currently published record is missing the fields required to validate this
            step. Continue is left available so the chapter flow stays usable.
          </p>
        </div>
      </div>
    </div>
  );
}

function GemIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/gems.png"
      alt="Gem"
      width={40}
      height={40}
      className={cn("object-contain", className)}
    />
  );
}

function StatPill({
  icon,
  tone,
  value,
}: {
  icon: ReactNode;
  tone: "green" | "pink";
  value: number;
}) {
  return (
    <div
      className={cn(
        "inline-flex min-w-[118px] items-center justify-center gap-3 rounded-full border px-5 py-3 shadow-[0_16px_34px_-28px_rgba(34,46,84,0.45)]",
        tone === "green"
          ? "border-[#d8efde] bg-white text-[#23974a]"
          : "border-[#f0d6df] bg-white text-[#ea4f74]",
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-current/10">
        {icon}
      </span>
      <div className="text-2xl font-semibold tracking-[-0.05em] text-[#203057]">{value}</div>
    </div>
  );
}

function NoContentNotice({ chapterName }: { chapterName: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-[#d6e0ef] bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.98))] px-6 py-7 text-center shadow-[0_24px_50px_-40px_rgba(34,46,84,0.35)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f6fb] text-[#7083a7]">
        <MessageSquareQuote className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#203057]">
        Chapter content is not available yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#5f7194]">
        We could not find a renderable content block for <strong>{chapterName}</strong>.
        This fallback avoids the blank state and makes the data issue visible.
      </p>
    </div>
  );
}

function RewardCard({
  accent,
  icon,
  label,
  sublabel,
  value,
}: {
  accent: "green" | "orange" | "pink";
  icon: ReactNode;
  label: string;
  sublabel?: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/80 bg-white/94 px-6 py-7 shadow-[0_26px_68px_-50px_rgba(34,46,84,0.42)]">
      <div
        className={cn(
          "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
          accent === "green" && "bg-[radial-gradient(circle_at_top,#ebffef_0%,#d4f6dc_100%)] text-[#2aa349]",
          accent === "pink" && "bg-[radial-gradient(circle_at_top,#fff0f6_0%,#ffdbe9_100%)] text-[#ec5378]",
          accent === "orange" && "bg-[radial-gradient(circle_at_top,#fff6ea_0%,#ffe0b8_100%)] text-[#ff8a38]",
        )}
      >
        {icon}
      </div>
      <div className="mt-5 text-4xl font-semibold tracking-[-0.08em] text-[#16214d]">
        {value}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#203057]">
        {label}
      </div>
      {sublabel ? (
        <div className="mt-2 text-sm leading-6 text-[#617293]">{sublabel}</div>
      ) : null}
    </div>
  );
}

function getCanContinue(
  block: ChapterContentBlockRecord | null,
  feedback: FeedbackState,
  isComplete: boolean,
) {
  if (isComplete || !block) {
    return false;
  }

  if (block.type === "theory" || block.type === "unsupported" || block.malformed) {
    return true;
  }

  return feedback?.variant === "success";
}

function getHintMessage(block: ChapterContentBlockRecord) {
  if (block.type === "theory") {
    return "Focus on the bold ideas and the examples in this explanation.";
  }

  if (block.type === "code-exercise") {
    return block.theoryMarkdown || "Use the instructions and the expected format as your guide.";
  }

  if ("incorrectFeedback" in block && block.incorrectFeedback.trim()) {
    return block.incorrectFeedback;
  }

  return "Look for the most specific instruction or the clearest supporting evidence.";
}

function isHintDisabled(block: ChapterContentBlockRecord | null, heartCount: number) {
  if (!block) {
    return true;
  }

  return heartCount <= 0;
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function shufflePairs(pairs: MatchingPairRecord[]) {
  const nextPairs = [...pairs];

  for (let index = nextPairs.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = nextPairs[index];
    nextPairs[index] = nextPairs[swapIndex];
    nextPairs[swapIndex] = current;
  }

  return nextPairs;
}
