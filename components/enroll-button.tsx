"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, ArrowRight, Loader2 } from "lucide-react";
import {
    ensureCourseEnrollment,
    readEnrolledCourseIds,
    subscribeToLearningProgress,
} from "@/lib/learning-progress";

export function EnrollButton({
    canEnroll = true,
    courseId,
    lockedReason = null,
}: {
    canEnroll?: boolean;
    courseId: string;
    lockedReason?: string | null;
}) {
    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        const syncEnrollment = () => {
            const enrolledIds = readEnrolledCourseIds();
            setIsEnrolled(enrolledIds.includes(courseId));
            setMounted(true);
        };

        syncEnrollment();
        return subscribeToLearningProgress(syncEnrollment);
    }, [courseId]);

    const handleEnroll = async () => {
        try {
            setIsSaving(true);
            await ensureCourseEnrollment(courseId);
            setIsEnrolled(true);
        } catch (e) {
            console.error("Failed to save enrollment:", e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted) {
        return (
            <div className="h-14 w-full max-w-[220px] animate-pulse rounded-2xl bg-[#edf0f6]" />
        );
    }

    if (isEnrolled) {
        return (
            <Button
                render={<Link href="#course-chapters" />}
                className="h-14 rounded-[1.15rem] bg-[linear-gradient(90deg,#2fae3f_0%,#3ec74f_100%)] px-6 text-lg font-semibold text-white shadow-[0_24px_50px_-28px_rgba(58,188,74,0.85)] hover:opacity-95"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2fae3f]">
                    <Play className="h-4 w-4 fill-current" />
                </span>
                Continue Course
                <ArrowRight className="h-5 w-5" />
            </Button>
        );
    }

    if (!canEnroll) {
        return (
            <div className="max-w-[320px]">
                <Button
                    render={<Link href="/dashboard/billing" />}
                    className="h-14 rounded-[1.15rem] bg-[#ff9b3d] px-8 text-lg font-semibold text-white shadow-lg shadow-[#ff9b3d]/25 hover:bg-[#f08f30]"
                >
                    Unlock With Subscription
                </Button>
                {lockedReason ? (
                    <p className="mt-3 text-sm leading-6 text-[#8a5a2b]">{lockedReason}</p>
                ) : null}
            </div>
        );
    }

    return (
        <Button
            onClick={() => void handleEnroll()}
            disabled={isSaving}
            className="h-14 rounded-[1.15rem] bg-accent px-8 text-lg font-semibold text-white hover:bg-accent-strong shadow-lg shadow-accent/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
        >
            {isSaving ? (
                <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Enrolling...
                </>
            ) : (
                <>
                    <Sparkles className="h-4 w-4 mr-1.5 animate-pulse" />
                    Start Course (Enroll)
                </>
            )}
        </Button>
    );
}
