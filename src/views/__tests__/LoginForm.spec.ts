import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

// vi.mock factories are hoisted above imports, so shared mocks must be hoisted too
const { push, login } = vi.hoisted(() => ({ push: vi.fn(), login: vi.fn() }));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query: {} }),
}));

// stores/auth imports the app router directly; the form only needs push()
vi.mock("@/router", () => ({ default: { push } }));

vi.mock("@/features/shared/auth/authApi", () => ({ login: (...a: unknown[]) => login(...a) }));
vi.mock("@/utils/utils", async (orig) => ({ ...(await orig<object>()), toasted: vi.fn() }));

import LoginForm from "../LoginForm.vue";

async function fillAndSubmit(wrapper: ReturnType<typeof mount>, user: string, pass: string) {
  const inputs = wrapper.findAll("input.custom-input");
  await inputs[0].setValue(user);
  await inputs[1].setValue(pass);
  await wrapper.find("button.lf-btn").trigger("click");
  await flushPromises();
  await new Promise((r) => setTimeout(r, 0));
  await flushPromises();
}

beforeEach(() => {
  setActivePinia(createPinia());
  push.mockReset();
  login.mockReset();
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe("LoginForm", () => {
  it("shows an inline error and stays on the page when the backend rejects the credentials", async () => {
    // The auth service answers bad credentials with a 500; responseHandler resolves it as success:false
    login.mockResolvedValue({ success: false, status: 500, error: "Invalid credentials provided" });
    const wrapper = mount(LoginForm, { attachTo: document.body, global: { directives: { focus: {} } } });

    await fillAndSubmit(wrapper, "someone", "wrong-password");

    expect(login).toHaveBeenCalledWith({ email: "someone", password: "wrong-password" });
    expect(wrapper.find('[role="alert"]').text()).toContain("The username or password you entered is incorrect.");
    expect(wrapper.find(".lf-success-overlay").exists()).toBe(false);
    expect(localStorage.getItem("userDetail")).toBeNull();
    expect(push).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("signs in, stores the session and redirects on success", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = { token: "t", roleCode: "ROLE_UNDERWRITER", firstName: "Abebe" };
    login.mockResolvedValue({ success: true, status: 200, data: user });
    localStorage.setItem("standard_active_testing_role", "ROLE_CLAIM_MANAGER"); // left by a previous demo
    const wrapper = mount(LoginForm, { attachTo: document.body, global: { directives: { focus: {} } } });

    await fillAndSubmit(wrapper, "abebe", "correct-password");

    expect(wrapper.find(".lf-success-overlay").exists()).toBe(true);
    expect(JSON.parse(localStorage.getItem("userDetail") || "{}").token).toBe("t");
    expect(localStorage.getItem("standard_active_testing_role")).toBeNull();
    vi.advanceTimersByTime(1000);
    expect(push).toHaveBeenCalledWith("/module-select");
    wrapper.unmount();
  });

  it("does not send the request when fields are empty", async () => {
    const wrapper = mount(LoginForm, { attachTo: document.body, global: { directives: { focus: {} } } });
    await wrapper.find("button.lf-btn").trigger("click");
    await flushPromises();
    expect(login).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
