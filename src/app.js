import config from "../runtime-config.js";
import { candidates } from "./candidates.js";
import { createBallot, orderCandidates } from "./ballot.js";
import { createDemoService } from "./services/demo.js";
const $ = (id) => document.getElementById(id);
const ballot = createBallot(candidates, config);
const ordered = orderCandidates(candidates);
const roles = ["leaders", "representatives"];
let step = 0,
  busy = false,
  signedIn = false,
  done = false;
const servicePromise =
  config.mode === "demo"
    ? Promise.resolve(createDemoService())
    : config.mode === "firebase"
      ? import("./services/firebase.js").then((m) =>
          m.createFirebaseService(config),
        )
      : Promise.reject(new Error("Unknown application mode."));
// Attach a rejection handler immediately; keep the UI available for actionable feedback.
servicePromise.catch(() => {
  $("notice").textContent =
    "Election services could not load. Refresh and try again.";
});
if (config.mode !== "demo") {
  $("login").textContent = "Sign in with Google";
  $("privacy").textContent =
    "Your ballot is linked to your authenticated account. Authorized election administrators can access submissions.";
}
function render(focus = false) {
  $("main").hidden = !signedIn && !done;
  $("sign-in").hidden = signedIn || done;
  $("candidates").hidden = !signedIn || step > 1 || done;
  $("review").hidden = !signedIn || step !== 2 || done;
  $("navigation").hidden = !signedIn || done;
  $("step-label").textContent = done
    ? "BALLOT COMPLETE"
    : `STEP 0${step + 1} OF 03`;
  $("title").textContent = done
    ? config.mode === "demo"
      ? "Demo ballot complete"
      : "Your ballot has been received"
    : [
        "Choose your student leaders",
        "Choose your representatives",
        "Review your ballot",
      ][step];
  const count = step < 2 ? ballot.selections(roles[step]).length : 0;
  const limit = step === 0 ? config.leaderCount : config.representativeCount;
  $("instruction").textContent = done
    ? config.mode === "demo"
      ? "Thanks for trying the election experience. No vote was sent or saved."
      : "Thank you for participating. You can close this window."
    : step < 2
      ? `Select ${limit} candidates. ${step === 1 ? "Your leadership choices are excluded from this section." : "House labels and outlines help you recognize each group."}`
      : "Check both sections before you submit. Use Back to make changes.";
  $("counter").hidden = step === 2 || done || !signedIn;
  $("counter").textContent = `${count} / ${limit} selected`;
  [...$("steps").children].forEach((el, i) => {
    if (i === step && !done) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
  });
  $("back").hidden = step === 0;
  $("back").disabled = busy;
  $("next").disabled = busy || (step < 2 && !ballot.complete(roles[step]));
  $("next").textContent = busy
    ? "Submitting…"
    : step === 2
      ? config.mode === "demo"
        ? "Complete demo ballot"
        : "Submit ballot"
      : "Continue →";
  $("help").textContent =
    step < 2
      ? `${Math.max(0, limit - count)} selection${limit - count === 1 ? "" : "s"} remaining`
      : "Both sections are complete.";
  if (step < 2 && signedIn && !done) {
    const role = roles[step];
    $("candidates").replaceChildren(
      ...ordered.map((candidate) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "candidate";
        const selected = ballot.selections(role).includes(candidate.id);
        const excluded =
          role === "representatives" &&
          ballot.selections("leaders").includes(candidate.id);
        button.dataset.candidate = candidate.id;
        button.style.setProperty("--house", candidate.color);
        button.setAttribute("aria-pressed", String(selected));
        button.disabled = excluded;
        const avatar = document.createElement("span");
        avatar.className = "avatar";
        avatar.textContent = candidate.name
          .split(" ")
          .map((s) => s[0])
          .join("");
        avatar.setAttribute("aria-hidden", "true");
        const name = document.createElement("strong");
        name.textContent = candidate.name;
        const house = document.createElement("span");
        house.className = "house";
        house.textContent = `${candidate.house} House`;
        const check = document.createElement("span");
        check.className = "choice";
        check.textContent = excluded
          ? "Selected for leadership"
          : selected
            ? "✓ Selected"
            : "Select candidate";
        button.append(avatar, name, house, check);
        button.addEventListener("click", () => {
          try {
            ballot.toggle(role, candidate.id);
            $("notice").textContent = "";
          } catch (error) {
            $("notice").textContent = error.message;
          }
          render();
          document.querySelector(`[data-candidate="${candidate.id}"]`)?.focus();
        });
        return button;
      }),
    );
  }
  if (step === 2 && !done) {
    $("review").replaceChildren(
      ...roles.map((role, i) => {
        const section = document.createElement("section"),
          heading = document.createElement("h2"),
          list = document.createElement("ul");
        heading.textContent = i === 0 ? "Student leaders" : "Representatives";
        for (const id of ballot.selections(role)) {
          const li = document.createElement("li");
          const c = candidates.find((c) => c.id === id);
          li.textContent = `${c.name} · ${c.house} House`;
          list.append(li);
        }
        section.append(heading, list);
        return section;
      }),
    );
  }
  if (focus) $("title").focus();
}
$("back").addEventListener("click", () => {
  if (!busy && step > 0) {
    step--;
    $("notice").textContent = "";
    render(true);
  }
});
$("next").addEventListener("click", async () => {
  if (busy || done || !signedIn) return;
  if (step < 2) {
    if (ballot.complete(roles[step])) {
      step++;
      render(true);
    }
    return;
  }
  busy = true;
  $("notice").textContent = "";
  render();
  try {
    const payload = ballot.payload();
    const service = await servicePromise;
    await service.submit(payload);
    done = true;
  } catch {
    $("notice").textContent =
      "Submission was not confirmed. Your choices are still here. Check your connection or contact the election administrator before retrying.";
  } finally {
    busy = false;
    render(true);
  }
});
$("login").addEventListener("click", async () => {
  $("login").disabled = true;
  try {
    await (await servicePromise).signIn();
    signedIn = true;
    $("notice").textContent = "";
    render(true);
  } catch {
    $("notice").textContent =
      "Sign-in could not be completed. Please use an eligible school account and try again.";
  } finally {
    $("login").disabled = false;
  }
});
render();
