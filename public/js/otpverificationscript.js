import { createModal, readCookie, createCookie } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll("fieldset input");
  const verifyButton = document.getElementById("verify-button");
  const errorMessage = document.getElementById("error-message");
  const resendLink = document.getElementById("resend-link");
  const resendTimer = document.getElementById("resend-timer");

  let timerInterval;
  let resendCooldown;

  function startResendTimer() {
    resendLink.style.display = "none";
    resendTimer.style.display = "block";
    resendCooldown = 29;
    resendTimer.textContent = `Resend in 00:${resendCooldown
      .toString()
      .padStart(2, "0")}`;

    timerInterval = setInterval(() => {
      resendCooldown--;
      resendTimer.textContent = `Resend in 00:${resendCooldown
        .toString()
        .padStart(2, "0")}`;
      if (resendCooldown <= 0) {
        clearInterval(timerInterval);
        resendLink.style.display = "inline";
        resendTimer.style.display = "none";
      }
    }, 1000);
  }

  function getOTP() {
    let otp = "";
    inputs.forEach((input) => {
      otp += input.value;
    });
    return otp;
  }

  function checkOTPValidity() {
    const otp = getOTP();
    if (otp.length === 6) {
      verifyButton.disabled = false;
    } else {
      verifyButton.disabled = true;
    }
  }

  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      if (input.value.length > 1) {
        input.value = input.value.slice(0, 1);
      }
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
      checkOTPValidity();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value === "" && index > 0) {
        inputs[index - 1].focus();
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputs[index - 1].focus();
      } else if (e.key === "ArrowRight" && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const otpArray = pasteData.split("");
      for (let i = 0; i < otpArray.length && index + i < inputs.length; i++) {
        inputs[index + i].value = otpArray[i];
      }
      const lastFilledIndex =
        Math.min(index + otpArray.length, inputs.length) - 1;
      if (lastFilledIndex < inputs.length - 1) {
        inputs[lastFilledIndex + 1].focus();
      } else {
        inputs[lastFilledIndex].focus();
      }
      checkOTPValidity();
    });
  });

  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get("email");

  if (email) {
    document.querySelector(
      "p.text-text-subtle"
    ).textContent = `Enter the 6-digit code we sent to ${email}.`;
  }

  verifyButton.addEventListener("click", () => {
    const code = getOTP();
    fetch("/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, code }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          errorMessage.classList.add("invisible");
          createCookie('token', data.token);
          createCookie('userId', data.userId);
          createModal("Success", "Your Email is Verified!", [
            {
              text: "OK",
              type: "primary",
              action: () => (window.location.href = "/"),
            },
          ]);
        } else {
          createModal("Error", data.message, [
            { text: "OK", type: "primary" },
          ]);
        }
      })
      .catch((err) => {
        console.error("Verification error:", err);
        createModal("Error", "An error occurred during verification.", [
          { text: "OK", type: "primary" },
        ]);
      });
  });

  resendLink.addEventListener("click", (e) => {
    e.preventDefault();
    fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("Resending OTP...");
          startResendTimer();
        } else {
          console.error("Resend OTP error:", data.message);
        }
      })
      .catch((err) => {
        console.error("Resend OTP error:", err);
      });
  });

  // Start the timer on page load
  startResendTimer();
});