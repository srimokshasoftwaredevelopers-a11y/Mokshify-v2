import { describe, expect, it } from "vitest";
import { addDays, daysBetween, fmtDate, fmtDuration, fmtPhone, rupees, rupeesShort } from "@/lib/format";
import {
  balance, fillTemplate, isPaymentOverdue, nextActionError, reminderDates, reminderLevel, responseSeconds,
  staleReasons, telLink, timerColour, waLink, winRate,
} from "@/lib/rules";

const at = (iso: string) => new Date(iso);
const DAY = 86_400_000;

describe("rule 1 · timer colour thresholds", () => {
  it("is green under 5 minutes", () => {
    expect(timerColour(0)).toBe("green");
    expect(timerColour(4 * 60 + 59)).toBe("green");
  });
  it("turns amber at exactly 5 minutes and stays amber under 60", () => {
    expect(timerColour(5 * 60)).toBe("amber");
    expect(timerColour(59 * 60 + 59)).toBe("amber");
  });
  it("turns red at 60 minutes and after", () => {
    expect(timerColour(60 * 60)).toBe("red");
    expect(timerColour(3 * 86_400)).toBe("red");
  });
});

describe("rule 1 · response-time calculation", () => {
  it("counts whole seconds from arrival to the first reply", () => {
    expect(responseSeconds(at("2026-11-23T10:00:00Z"), at("2026-11-23T10:04:12Z"))).toBe(252);
  });
  it("rounds to the nearest second and is never negative", () => {
    expect(responseSeconds(at("2026-11-23T10:00:00.000Z"), at("2026-11-23T10:00:01.600Z"))).toBe(2);
    expect(responseSeconds(at("2026-11-23T10:00:05Z"), at("2026-11-23T10:00:00Z"))).toBe(0);
  });
  it("formats durations for the timer", () => {
    expect(fmtDuration(42)).toBe("42s");
    expect(fmtDuration(252)).toBe("4m 12s");
    expect(fmtDuration(2 * 3600 + 5 * 60)).toBe("2h 05m");
    expect(fmtDuration(3 * 86_400 + 4 * 3600)).toBe("3d 4h");
  });
});

describe("rule 3 · no open deal without a next step", () => {
  it("rejects an open deal with no next action or no date", () => {
    expect(nextActionError({ stage: "proposal", nextAction: "", nextActionDate: "2026-11-25" })).toMatch(/next action/);
    expect(nextActionError({ stage: "proposal", nextAction: "   ", nextActionDate: "2026-11-25" })).toMatch(/next action/);
    expect(nextActionError({ stage: "discovery", nextAction: "Call", nextActionDate: null })).toMatch(/date/);
    expect(nextActionError({ stage: "new", nextAction: "Call", nextActionDate: "25/11/2026" })).toMatch(/date/);
  });
  it("accepts an open deal with both", () => {
    expect(nextActionError({ stage: "negotiation", nextAction: "Send revised quote", nextActionDate: "2026-11-25" })).toBeNull();
  });
  it("does not require a next step once won or lost", () => {
    expect(nextActionError({ stage: "won" })).toBeNull();
    expect(nextActionError({ stage: "lost", nextAction: null, nextActionDate: null })).toBeNull();
  });
});

describe("rule 4 · stale-deal detection", () => {
  const now = at("2026-11-23T12:00:00Z");
  it("flags an open deal with no activity for 7 days", () => {
    expect(staleReasons({ stage: "discovery", lastActivityAt: new Date(now.getTime() - 7 * DAY), stageChangedAt: new Date(now.getTime() - 20 * DAY) }, now)).toEqual(["idle"]);
    expect(staleReasons({ stage: "discovery", lastActivityAt: new Date(now.getTime() - 6.9 * DAY), stageChangedAt: new Date(now.getTime() - 20 * DAY) }, now)).toEqual([]);
  });
  it("flags a proposal unanswered for 3 days", () => {
    const sent = new Date(now.getTime() - 3 * DAY);
    expect(staleReasons({ stage: "proposal", lastActivityAt: sent, stageChangedAt: sent }, now)).toEqual(["proposal"]);
  });
  it("does not flag a proposal with activity since it was sent", () => {
    expect(staleReasons({ stage: "proposal", stageChangedAt: new Date(now.getTime() - 5 * DAY), lastActivityAt: new Date(now.getTime() - 1 * DAY) }, now)).toEqual([]);
  });
  it("can be both idle and an unanswered proposal", () => {
    const old = new Date(now.getTime() - 9 * DAY);
    expect(staleReasons({ stage: "proposal", lastActivityAt: old, stageChangedAt: old }, now)).toEqual(["idle", "proposal"]);
  });
  it("never flags a closed deal", () => {
    const old = new Date(now.getTime() - 90 * DAY);
    expect(staleReasons({ stage: "won", lastActivityAt: old, stageChangedAt: old }, now)).toEqual([]);
    expect(staleReasons({ stage: "lost", lastActivityAt: old, stageChangedAt: old }, now)).toEqual([]);
  });
});

describe("rule 5 · balance calculation", () => {
  it("counts only received payments against the agreed amount", () => {
    expect(balance(180000, [
      { amount: 72000, status: "received" },
      { amount: 54000, status: "due" },
      { amount: 54000, status: "cancelled" },
    ])).toEqual({ agreed: 180000, received: 72000, balance: 108000 });
  });
  it("is zero when fully paid and negative when overpaid", () => {
    expect(balance(60000, [{ amount: 30000, status: "received" }, { amount: 30000, status: "received" }]).balance).toBe(0);
    expect(balance(50000, [{ amount: 60000, status: "received" }]).balance).toBe(-10000);
  });
  it("flags a due payment past its date as overdue", () => {
    expect(isPaymentOverdue({ status: "due", dueDate: "2026-11-22" }, "2026-11-23")).toBe(true);
    expect(isPaymentOverdue({ status: "due", dueDate: "2026-11-23" }, "2026-11-23")).toBe(false);
    expect(isPaymentOverdue({ status: "received", dueDate: "2026-11-01" }, "2026-11-23")).toBe(false);
  });
});

describe("rule 6 · renewal reminder dates", () => {
  it("reminds 30, 14 and 3 days before the renewal date", () => {
    expect(reminderDates("2026-12-20")).toEqual(["2026-11-20", "2026-12-06", "2026-12-17"]);
  });
  it("crosses month and year boundaries correctly", () => {
    expect(reminderDates("2027-01-10")).toEqual(["2026-12-11", "2026-12-27", "2027-01-07"]);
    expect(reminderDates("2028-03-01", [3])).toEqual(["2028-02-27"]);          // leap year
  });
  it("puts the renewal in the right reminder band", () => {
    expect(reminderLevel("2026-12-24", "2026-11-23")).toBeNull();            // 31 days out
    expect(reminderLevel("2026-12-23", "2026-11-23")).toBe("30");
    expect(reminderLevel("2026-12-07", "2026-11-23")).toBe("14");
    expect(reminderLevel("2026-11-26", "2026-11-23")).toBe("3");
    expect(reminderLevel("2026-11-23", "2026-11-23")).toBe("3");
    expect(reminderLevel("2026-11-22", "2026-11-23")).toBe("overdue");
  });
});

describe("rupee formatting", () => {
  it("uses Indian digit grouping", () => {
    expect(rupees(420000)).toBe("₹4,20,000");
    expect(rupees(12345678)).toBe("₹1,23,45,678");
    expect(rupees(999)).toBe("₹999");
    expect(rupees(0)).toBe("₹0");
  });
  it("rounds to whole rupees", () => {
    expect(rupees(1499.6)).toBe("₹1,500");
  });
  it("has a short form for cards", () => {
    expect(rupeesShort(420000)).toBe("₹4.2L");
    expect(rupeesShort(1000000)).toBe("₹10L");
    expect(rupeesShort(12500000)).toBe("₹1.25Cr");
    expect(rupeesShort(85000)).toBe("₹85K");
    expect(rupeesShort(1500)).toBe("₹1.5K");
    expect(rupeesShort(750)).toBe("₹750");
  });
});

describe("dates, phones and reply links", () => {
  it("writes dates as 23 Nov 2026, in Asia/Kolkata", () => {
    expect(fmtDate("2026-11-23")).toBe("23 Nov 2026");
    expect(fmtDate(at("2026-11-22T20:00:00Z"))).toBe("23 Nov 2026");     // 01:30 IST on the 23rd
  });
  it("does calendar arithmetic", () => {
    expect(addDays("2026-11-23", 8)).toBe("2026-12-01");
    expect(daysBetween("2026-11-23", "2026-12-23")).toBe(30);
  });
  it("formats Indian mobiles and builds tel: and wa.me links", () => {
    expect(fmtPhone("9876543210")).toBe("+91 98765 43210");
    expect(fmtPhone("+91-98765-43210")).toBe("+91 98765 43210");
    expect(telLink("98765 43210")).toBe("tel:+919876543210");
    expect(waLink("+91 98765 43210", "Hello Ravi")).toBe("https://wa.me/919876543210?text=Hello%20Ravi");
    expect(waLink("123")).toBeNull();
  });
  it("fills reply templates", () => {
    expect(fillTemplate("Hello {name}, about {service}.", { name: "Ravi", service: "your website" })).toBe("Hello Ravi, about your website.");
    expect(fillTemplate("Hello {name} from {company}.", { name: "Ravi", company: "" })).toBe("Hello Ravi from there.");
  });
  it("computes win rate", () => {
    expect(winRate(3, 1)).toBe(0.75);
    expect(winRate(0, 0)).toBeNull();
  });
});
