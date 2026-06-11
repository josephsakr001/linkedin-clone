const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const WHISH_BASE_URL = process.env.WHISH_BASE_URL;
const WHISH_CHANNEL = process.env.WHISH_CHANNEL;
const WHISH_SECRET = process.env.WHISH_SECRET;
const WEBSITE_URL = process.env.WEBSITE_URL;

console.log("ENV TEST:");
console.log("WHISH_BASE_URL =", WHISH_BASE_URL);
console.log("WEBSITE_URL =", WEBSITE_URL);

function getPlanPrice(plan, billingType) {
  if (plan === "starter" && billingType === "monthly") return 0;
  if (plan === "starter" && billingType === "annually") return 130;

  if (plan === "builder" && billingType === "monthly") return 21.5;
  if (plan === "builder" && billingType === "annually") return 194;

  if (plan === "premium" && billingType === "monthly") return 25;
  if (plan === "premium" && billingType === "annually") return 240;

  return 0;
}

function getPlanName(plan) {
  if (plan === "starter") return "Explorer";
  if (plan === "builder") return "Builder";
  if (plan === "premium") return "Expert";
  return "Explorer";
}

app.post("/create-whish-payment", async (req, res) => {
  try {
    const { plan, billingType, externalId } = req.body;

    if (!plan || !billingType || !externalId) {
      return res.status(400).json({
        success: false,
        message: "Missing plan, billingType, or externalId"
      });
    }

    const amount = getPlanPrice(plan, billingType);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Free plan does not need Whish payment"
      });
    }

    const payload = {
      amount: String(amount),
      currency: "USD",
      invoice: `CareExpert ${getPlanName(plan)} ${billingType}`,
      externalId: Number(externalId),
      successCallbackUrl: `${WEBSITE_URL}/payment-success.html?externalId=${externalId}&plan=${plan}&billing=${billingType}`,
      failureCallbackUrl: `${WEBSITE_URL}/payment-failed.html?externalId=${externalId}&plan=${plan}&billing=${billingType}`,
      successRedirectUrl: `${WEBSITE_URL}/payment-success.html?externalId=${externalId}&plan=${plan}&billing=${billingType}`,
      failureRedirectUrl: `${WEBSITE_URL}/payment-failed.html?externalId=${externalId}&plan=${plan}&billing=${billingType}`
    };

    console.log("WHISH PAYLOAD:", payload);

    const response = await fetch(`${WHISH_BASE_URL}/payment/whish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        channel: WHISH_CHANNEL,
        secret: WHISH_SECRET,
        websiteUrl: WEBSITE_URL,
        "User-Agent": "Whish/1.0 (https://whish.money; support@whish.money)"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    console.log("WHISH HTTP STATUS:", response.status);
    console.log("WHISH RAW RESPONSE:", rawText);

    let result;

    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: "Whish returned non-JSON response",
        raw: rawText
      });
    }

    if (!result.status) {
      return res.status(400).json({
        success: false,
        message: result.dialog?.message || "Whish payment failed",
        whish: result
      });
    }

    return res.json({
      success: true,
      collectUrl: result.data.collectUrl,
      externalId: externalId,
      whish: result
    });

  } catch (err) {
    console.error("Whish payment error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.post("/check-whish-status", async (req, res) => {
  try {
    const { externalId } = req.body;

    if (!externalId) {
      return res.status(400).json({
        success: false,
        message: "Missing externalId"
      });
    }

    const payload = {
      currency: "USD",
      externalId: Number(externalId)
    };

    const response = await fetch(`${WHISH_BASE_URL}/payment/collect/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        channel: WHISH_CHANNEL,
        secret: WHISH_SECRET,
        websiteUrl: WEBSITE_URL,
        "User-Agent": "Whish/1.0 (https://whish.money; support@whish.money)"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    console.log("WHISH STATUS RAW RESPONSE:", rawText);

    let result;

    try {
      result = JSON.parse(rawText);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        message: "Whish status returned non-JSON response",
        raw: rawText
      });
    }

    return res.json({
      success: result.status,
      whish: result
    });

  } catch (err) {
    console.error("Whish status error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Whish server running on port ${process.env.PORT || 3000}`);
});