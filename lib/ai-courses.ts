import type {
  StrapiChapterContentBlock,
  StrapiCourse,
  StrapiCourseChapter,
} from "@/lib/strapi-courses";

type Choice = {
  id: string;
  isCorrect: boolean;
  text: string;
};

type Pair = {
  id: string;
  left: string;
  right: string;
};

let nextBlockId = 1;

function blockId() {
  const id = nextBlockId;
  nextBlockId += 1;
  return id;
}

function theory(title: string, bodyMarkdown: string): StrapiChapterContentBlock {
  return {
    __component: "learning.theory-block",
    bodyMarkdown,
    id: blockId(),
    title,
  };
}

function multipleChoice(
  title: string,
  question: string,
  choices: Choice[],
  correctFeedback: string,
  incorrectFeedback: string,
): StrapiChapterContentBlock {
  return {
    __component: "learning.multiple-choice-block",
    choices,
    correctFeedback,
    id: blockId(),
    incorrectFeedback,
    question,
    title,
  };
}

function trueFalse(
  title: string,
  statement: string,
  correctAnswer: boolean,
  correctFeedback: string,
  incorrectFeedback: string,
): StrapiChapterContentBlock {
  return {
    __component: "learning.true-false-block",
    correctAnswer,
    correctFeedback,
    id: blockId(),
    incorrectFeedback,
    statement,
    title,
  };
}

function yesNo(
  title: string,
  question: string,
  correctAnswer: boolean,
  correctFeedback: string,
  incorrectFeedback: string,
): StrapiChapterContentBlock {
  return {
    __component: "learning.yes-no-block",
    correctAnswer,
    correctFeedback,
    id: blockId(),
    incorrectFeedback,
    question,
    title,
  };
}

function fillIn(
  title: string,
  prompt: string,
  options: Choice[],
  correctFeedback: string,
  incorrectFeedback: string,
): StrapiChapterContentBlock {
  return {
    __component: "learning.fill-in-the-blank-block",
    correctFeedback,
    id: blockId(),
    incorrectFeedback,
    options,
    prompt,
    title,
  };
}

function matching(
  title: string,
  question: string,
  pairs: Pair[],
  correctFeedback: string,
  incorrectFeedback: string,
): StrapiChapterContentBlock {
  return {
    __component: "learning.matching-block",
    correctFeedback,
    id: blockId(),
    incorrectFeedback,
    pairs,
    question,
    title,
  };
}

function codeExercise(
  title: string,
  taskPrompt: string,
  codeSnippet: string,
  expectedAnswer: string,
  successFeedback: string,
  failureFeedback: string,
): StrapiChapterContentBlock {
  return {
    __component: "learning.code-exercise-block",
    codeLanguage: "text",
    codeSnippet,
    expectedAnswer,
    failureFeedback,
    id: blockId(),
    placeholderAnswer: "Type the missing word",
    successFeedback,
    taskPrompt,
    theoryMarkdown:
      "Language models follow the instruction you write. A short role, a clear task, and the context you want used are enough to start.",
    title,
  };
}

function chapter(
  courseSlug: string,
  chapterNumber: number,
  slug: string,
  name: string,
  description: string,
  emoji: string,
  contentBlocks: StrapiChapterContentBlock[],
): StrapiCourseChapter {
  return {
    chapterNumber,
    contentBlocks,
    description,
    documentId: `${courseSlug}.${slug}`,
    emoji,
    id: chapterNumber,
    name,
    slug,
    sortOrder: chapterNumber,
  };
}

function course(
  sortOrder: number,
  input: {
    accessType: "free" | "freemium" | "paid";
    banner: string;
    chapters: StrapiCourseChapter[];
    difficultyLevel: string;
    estimatedMinutes: number;
    isFeatured?: boolean;
    name: string;
    shortDescription: string;
    slug: string;
  },
): StrapiCourse {
  return {
    accessType: input.accessType,
    banner: {
      alternativeText: input.name,
      height: 1254,
      url: input.banner,
      width: 1254,
    },
    chapters: input.chapters,
    difficultyLevel: input.difficultyLevel,
    documentId: `course.${input.slug}`,
    estimatedMinutes: input.estimatedMinutes,
    id: sortOrder,
    isFeatured: Boolean(input.isFeatured),
    isPublishedInApp: true,
    name: input.name,
    shortDescription: input.shortDescription,
    slug: input.slug,
    sortOrder,
  };
}

export const AI_COURSE_SOURCES: StrapiCourse[] = [
  course(1, {
    accessType: "free",
    banner: "/characters/Byte_1.png",
    difficultyLevel: "Beginner",
    estimatedMinutes: 20,
    isFeatured: true,
    name: "How AI Learns",
    shortDescription:
      "See what a model is, how training differs from using it, and why an answer is a guess rather than a lookup.",
    slug: "how-ai-learns",
    chapters: [
      chapter(
        "how-ai-learns",
        1,
        "what-a-model-is",
        "What a model is",
        "A model is a pattern finder, not a person and not a search box.",
        "🧠",
        [
          theory(
            "A model stores patterns",
            [
              "An AI model is a program that has learned patterns from examples. When you ask it something, it uses those patterns to produce a likely next answer. It does not open a folder of facts and read the right page.",
              "A language model predicts text. A picture model predicts pixels. The useful part is the same: the model continues a pattern it has seen many times before.",
            ].join("\n\n"),
          ),
          multipleChoice(
            "Pick the closest description",
            "Which description best fits a language model?",
            [
              { id: "search", isCorrect: false, text: "A search engine that always quotes a source" },
              { id: "pattern", isCorrect: true, text: "A pattern finder that predicts likely text" },
              { id: "person", isCorrect: false, text: "A person who remembers every page it read" },
            ],
            "Yes. It predicts a likely continuation from patterns in its training.",
            "It is closer to a pattern finder than to a library or a person.",
          ),
          trueFalse(
            "Models and facts",
            "A language model checks a private encyclopedia before every answer.",
            false,
            "Right. Nothing in a basic chat reply proves the model looked a fact up.",
            "A plain model reply is a prediction. Lookup only happens if a tool does it.",
          ),
        ],
      ),
      chapter(
        "how-ai-learns",
        2,
        "training-and-use",
        "Training and use",
        "Training builds the patterns. A chat is just using them.",
        "📚",
        [
          theory(
            "Two different moments",
            [
              "Training is the long job where the model sees examples and adjusts until its predictions get better. That work already happened before you open a chat.",
              "Using the model is different. Your prompt is new input. The model applies patterns it already has. It does not usually learn your conversation as a permanent new skill.",
            ].join("\n\n"),
          ),
          yesNo(
            "Does the chat retrain the model?",
            "Does a normal chat message retrain the whole model before the reply appears?",
            false,
            "Correct. The reply uses an existing model. Training is a separate, much larger job.",
            "A single message is use, not a full training run.",
          ),
          matching(
            "Match the moment",
            "Match each moment with what is happening.",
            [
              { id: "train", left: "Training", right: "The model adjusts from many examples" },
              { id: "use", left: "Using the model", right: "The model answers from patterns it already has" },
              { id: "tool", left: "A tool call", right: "The app looks something up or takes an action" },
            ],
            "Those three jobs are easy to mix up, and they are not the same.",
            "Training changes the model. A chat uses it. A tool does a separate action.",
          ),
        ],
      ),
      chapter(
        "how-ai-learns",
        3,
        "why-answers-vary",
        "Why answers vary",
        "The same question can get a different reply because the model is sampling likely text.",
        "🎲",
        [
          theory(
            "Likely, not locked",
            [
              "Many models choose among several likely next words. That is why the same prompt can come back a little different the second time.",
              "A confident tone does not mean the answer was retrieved from a source. If the task needs a stable fact, ask for the source, or check it yourself.",
            ].join("\n\n"),
          ),
          fillIn(
            "Name the behavior",
            "A model answer is a likely ____, not a guaranteed fact.",
            [
              { id: "guess", isCorrect: true, text: "prediction" },
              { id: "file", isCorrect: false, text: "file download" },
              { id: "law", isCorrect: false, text: "legal ruling" },
            ],
            "Prediction is the right word. The model continues a pattern.",
            "Look for the word that describes a likely continuation.",
          ),
        ],
      ),
    ],
  }),
  course(2, {
    accessType: "free",
    banner: "/characters/pip.png",
    difficultyLevel: "Beginner",
    estimatedMinutes: 18,
    name: "Prompting Language Models",
    shortDescription:
      "Write prompts that name the job, the context, and the shape of the answer you want back.",
    slug: "prompting-language-models",
    chapters: [
      chapter(
        "prompting-language-models",
        1,
        "instructions-and-context",
        "Instructions and context",
        "A useful prompt says what to do and what to use.",
        "✍️",
        [
          theory(
            "Say the job",
            [
              "A prompt is the text you give the model. Weak prompts say “help me with this.” Strong prompts name the reader, the task, and the material the model should use.",
              "Put the context in the prompt when the model cannot see your screen. A model cannot use a file, a chat, or a page you forgot to paste.",
            ].join("\n\n"),
          ),
          multipleChoice(
            "Which prompt is clearer?",
            "You want a study plan. Which prompt gives the model enough to start?",
            [
              { id: "vague", isCorrect: false, text: "Make me better at AI." },
              {
                id: "clear",
                isCorrect: true,
                text: "Make a 7-day beginner plan for learning how language models answer questions. Each day needs one 20-minute task.",
              },
              { id: "empty", isCorrect: false, text: "Do the thing we talked about." },
            ],
            "The specific prompt names the topic, the level, and the shape of the result.",
            "Look for the prompt that states the task, the level, and the format.",
          ),
        ],
      ),
      chapter(
        "prompting-language-models",
        2,
        "shape-the-answer",
        "Shape the answer",
        "Tell the model how the reply should look.",
        "🧩",
        [
          theory(
            "Format is part of the task",
            [
              "Ask for a format when you need one: three bullets, a table, a short definition, or steps a beginner can follow.",
              "Also name what to leave out. “Skip sales language” or “do not invent sources” keeps the reply closer to the job.",
            ].join("\n\n"),
          ),
          codeExercise(
            "Finish the prompt",
            "The prompt below is missing the format. Type the word steps.",
            "Explain tokens to a beginner in five ____.",
            "steps",
            "Yes. Naming the format tells the model how to arrange the explanation.",
            "The missing word is the format: steps.",
          ),
          trueFalse(
            "Hidden context",
            "The model can use a document you did not paste, upload, or connect.",
            false,
            "Right. If the model cannot see it, the prompt does not include it.",
            "Unseen files are not part of the prompt.",
          ),
        ],
      ),
      chapter(
        "prompting-language-models",
        3,
        "revise-the-reply",
        "Revise the reply",
        "The first answer is a draft. The next prompt should say what to change.",
        "🔁",
        [
          theory(
            "Steer the next turn",
            "If the reply is too long, too vague, or missing a constraint, say that in the next message. “Make this half as long and keep the example” is a better revision than starting over with “try again.”",
          ),
          yesNo(
            "Should you throw the draft away?",
            "Is “try again” the most precise way to fix a reply that is too long?",
            false,
            "Correct. Tell the model what to change. Length, audience, and missing pieces are all fair instructions.",
            "A revision prompt should name the change you want.",
          ),
        ],
      ),
    ],
  }),
  course(3, {
    accessType: "freemium",
    banner: "/characters/Nimbus_1.png",
    difficultyLevel: "Intermediate",
    estimatedMinutes: 24,
    name: "Working with AI Agents",
    shortDescription:
      "Learn how an agent uses a model plus tools, how to give it a bounded job, and when to keep the work yourself.",
    slug: "working-with-ai-agents",
    chapters: [
      chapter(
        "working-with-ai-agents",
        1,
        "model-plus-tools",
        "A model plus tools",
        "An agent is not a smarter model. It is a model allowed to take steps.",
        "🛠️",
        [
          theory(
            "What changes with an agent",
            [
              "A chat model writes a reply. An agent can also call tools: search, read a file, run a command, or send a message. The model chooses a next step, sees the result, and continues.",
              "The extra power is also the extra risk. A tool can change something real, so the job and the limits need to be explicit.",
            ].join("\n\n"),
          ),
          matching(
            "Chat or agent?",
            "Match each behavior with the system that does it.",
            [
              { id: "reply", left: "Writes an answer in the chat", right: "Language model" },
              { id: "search", left: "Searches the web, then answers", right: "Agent using a tool" },
              { id: "edit", left: "Edits a file after you approve it", right: "Agent using a tool" },
            ],
            "Tools are what turn a reply into a sequence of actions.",
            "If it only writes text, it is the model. If it acts, a tool is involved.",
          ),
        ],
      ),
      chapter(
        "working-with-ai-agents",
        2,
        "bound-the-job",
        "Bound the job",
        "Give an agent a finish line, the files it may touch, and what done means.",
        "🎯",
        [
          theory(
            "A job, not a vibe",
            "“Make this better” leaves the agent to invent the goal. “Update the course descriptions so each one says what the learner will be able to do. Do not change billing.” is a job with a boundary.",
          ),
          multipleChoice(
            "Choose the bounded job",
            "Which request is safest to hand to an agent?",
            [
              { id: "open", isCorrect: false, text: "Improve the whole product however you like." },
              {
                id: "bounded",
                isCorrect: true,
                text: "Rewrite these three lesson titles so they say they teach AI. Leave the quizzes as they are.",
              },
              { id: "secret", isCorrect: false, text: "Use my passwords to sign in and fix my account." },
            ],
            "The bounded job names the files, the change, and what to leave alone.",
            "Look for a finish line and a limit. Credentials are not a task to delegate.",
          ),
        ],
      ),
      chapter(
        "working-with-ai-agents",
        3,
        "read-the-steps",
        "Read the steps",
        "Check the actions, not only the final paragraph.",
        "👀",
        [
          theory(
            "The trail matters",
            "When an agent shows tool calls, read them. A polished summary can hide a skipped file or an extra edit. The steps are the work.",
          ),
          trueFalse(
            "Trust the summary alone",
            "A tidy final summary is enough proof that an agent only changed what you asked.",
            false,
            "Right. The actions are the evidence. The summary is the agent describing them.",
            "Check the steps. The summary can leave something out.",
          ),
        ],
      ),
      chapter(
        "working-with-ai-agents",
        4,
        "keep-the-work",
        "When to keep the work",
        "Some jobs should stay with you.",
        "🛟",
        [
          theory(
            "Do not delegate the judgment",
            [
              "Keep decisions that need your authority: sending a message as you, spending money, changing production, or handling someone else’s private data.",
              "An agent is useful for a draft, a search, or a narrow edit you can review. It is a poor owner of a consequence you cannot undo.",
            ].join("\n\n"),
          ),
          yesNo(
            "Who owns the send button?",
            "Should an agent send an email to your whole team without you reading it?",
            false,
            "Correct. You can ask for a draft. You should read anything that goes out as you.",
            "Drafting is fine. Sending without review hands away your judgment.",
          ),
        ],
      ),
    ],
  }),
  course(4, {
    accessType: "free",
    banner: "/characters/Hedge_1.png",
    difficultyLevel: "Beginner",
    estimatedMinutes: 16,
    name: "Checking What AI Says",
    shortDescription:
      "Practice spotting fluent mistakes, missing sources, and answers that sound finished but were not checked.",
    slug: "checking-what-ai-says",
    chapters: [
      chapter(
        "checking-what-ai-says",
        1,
        "fluent-and-wrong",
        "Fluent and wrong",
        "Clear writing is not the same as a true claim.",
        "🔎",
        [
          theory(
            "Style is cheap",
            "Models are good at sounding sure. A citation, a date, a name, or a number can be invented because it fits the pattern of a careful answer. Read the claim, not the tone.",
          ),
          trueFalse(
            "Tone and truth",
            "A reply written in careful, formal language is therefore accurate.",
            false,
            "Yes. Tone and accuracy are separate. Check the claim.",
            "Formal language is a style the model can copy even when the fact is wrong.",
          ),
        ],
      ),
      chapter(
        "checking-what-ai-says",
        2,
        "ask-for-the-source",
        "Ask for the source",
        "If a fact matters, the answer should point at something you can open.",
        "📎",
        [
          theory(
            "A source you can open",
            "Ask which page, file, or dataset supports the claim. Then open it. A title with no link, or a link that does not say what the model claimed, is not a source yet.",
          ),
          fillIn(
            "What should you open?",
            "A useful source is one you can ____ and compare with the claim.",
            [
              { id: "open", isCorrect: true, text: "open" },
              { id: "trust", isCorrect: false, text: "admire" },
              { id: "skip", isCorrect: false, text: "skip" },
            ],
            "Open it. A source you cannot inspect does not check the answer.",
            "The check is to open the source and compare it with the claim.",
          ),
        ],
      ),
      chapter(
        "checking-what-ai-says",
        3,
        "a-simple-check",
        "A simple check",
        "Before you use an answer, name what would make it fail.",
        "✅",
        [
          theory(
            "Three questions",
            "Before you rely on a reply, ask: What is the actual claim? What would show it is wrong? Did the model see the material this claim depends on? If you cannot answer those, the reply is still a draft.",
          ),
          multipleChoice(
            "What do you check first?",
            "An AI summary of a paper says the paper proved something. What is the first check?",
            [
              { id: "share", isCorrect: false, text: "Share the summary, because it sounds specific." },
              { id: "paper", isCorrect: true, text: "Open the paper and see if it actually says that." },
              { id: "longer", isCorrect: false, text: "Ask for a longer summary and trust that one." },
            ],
            "The paper is the source. The summary is a claim about it.",
            "A longer draft is still a draft. Open the source.",
          ),
        ],
      ),
    ],
  }),
  course(5, {
    accessType: "freemium",
    banner: "/characters/Uni_1.png",
    difficultyLevel: "Intermediate",
    estimatedMinutes: 22,
    name: "AI for Everyday Work",
    shortDescription:
      "Use a model to draft, summarize, and practice, while keeping private information and final judgment with you.",
    slug: "ai-for-everyday-work",
    chapters: [
      chapter(
        "ai-for-everyday-work",
        1,
        "drafts",
        "Start from a draft",
        "Let the model write the first pass. You decide what is worth keeping.",
        "📝",
        [
          theory(
            "A draft is the job",
            "Models are useful when the hard part is getting words on the page: an outline, a lesson draft, a rewrite in simpler language. Treat the result as raw material. You still choose the claim and the tone.",
          ),
          yesNo(
            "Who is the author?",
            "If you send a model’s draft unchanged, did you still need to decide that it was right?",
            true,
            "Yes. Sending it means you accepted the claims, even if you did not type them.",
            "Using the draft does not move responsibility off you.",
          ),
        ],
      ),
      chapter(
        "ai-for-everyday-work",
        2,
        "summaries",
        "Summaries that keep the point",
        "Tell the model what the summary is for.",
        "✂️",
        [
          theory(
            "Purpose changes the cut",
            "“Summarize this” often drops the part you needed. Say who will read it and what decision it supports. “Summarize the risks for a beginner who will follow these steps” keeps different sentences than a title-only recap.",
          ),
          multipleChoice(
            "Pick the better summary prompt",
            "Which prompt protects the point of a lesson?",
            [
              { id: "short", isCorrect: false, text: "Make this shorter." },
              {
                id: "purpose",
                isCorrect: true,
                text: "Summarize this lesson in 5 bullets a beginner can study from. Keep the definition and the warning.",
              },
              { id: "fun", isCorrect: false, text: "Make this fun and add extra facts." },
            ],
            "The useful prompt names the reader, the length, and what must survive.",
            "Shorter is not the same as complete. Extra facts are a new risk.",
          ),
        ],
      ),
      chapter(
        "ai-for-everyday-work",
        3,
        "private-information",
        "Leave private details out",
        "A prompt is a copy of whatever you paste into it.",
        "🔒",
        [
          theory(
            "Paste less",
            "Do not paste passwords, private keys, health details, or someone else’s personal data into a prompt so the draft sounds specific. Replace them with placeholders like “Customer A” or “the API key.” The model does not need the real secret to practice the shape of the task.",
          ),
          trueFalse(
            "Secrets in prompts",
            "A password pasted into a prompt stays only on your computer.",
            false,
            "Right. The prompt is sent to the service that runs the model.",
            "Pasting a secret sends it with the prompt.",
          ),
        ],
      ),
      chapter(
        "ai-for-everyday-work",
        4,
        "a-practice-loop",
        "A practice loop",
        "Short, repeated use beats one long session.",
        "📆",
        [
          theory(
            "One loop",
            "A useful practice is small: ask for a draft, change one instruction, check the claim against a source, and write down what the second prompt fixed. That is the skill, more than collecting longer replies.",
          ),
          fillIn(
            "Name the habit",
            "After a draft, ____ one instruction and compare the new reply.",
            [
              { id: "change", isCorrect: true, text: "change" },
              { id: "hide", isCorrect: false, text: "hide" },
              { id: "trust", isCorrect: false, text: "trust" },
            ],
            "Changing one instruction shows you what the prompt was doing.",
            "The habit is to change the instruction and look at the difference.",
          ),
        ],
      ),
    ],
  }),
];
