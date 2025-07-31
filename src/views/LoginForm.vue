<script setup >
import Button from '@/components/Button.vue';
import { Form } from '@/components/new_form_builder';
import Input from '@/components/new_form_elements/Input.vue';
import InputPassword from '@/components/new_form_elements/InputPassword.vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { login,  } from '@/features/auth/authApi';
import { useAuthStore } from '@/stores/auth';
import { toasted } from '@/utils/utils';
import { useRouter } from 'vue-router';
const req = useApiRequest()
const auth = useAuthStore()
const router = useRouter()

function loginUser({ values }) {
	req.send(
		() => login(values),
		res => {
			if(res.success) {
				auth.setAuth(res.data)
				localStorage.setItem('userDetail', JSON.stringify(res.data))
				router.replace('/')
				toasted(true, 'Loggedin Successfully')
			}
		}
	)
}

</script>

<template>
     <div
    class="bg-[#F7F7F9]  sm:w-full   shadow-lg min-h-fit py-24 px-16 items-center justify-center flex flex-col rounded-3xl gap-10"
  >
    <div class="flex flex-col w-full gap-4 items-center">
      <img class="h-30 " src="/src/assets/img/logo.png" />

      <p class="font-bold text-2xl text-primary">HealthConnect</p>
    </div>
    <div class="grid  w-full">
			<Form v-slot="{ submit }" id="login-form" class="  flex w-full flex-col gap-8">
				<!-- <p class="text-3xl uppercase">Welcome to Insurance login</p> -->
                 <div class=" space-y-4">
                    <Input
					:focus="true"
					validation="required|email"
					label="Email"
					name="email"
					:attributes="{
						placeholder: 'Email',
					}"
				/>
				<InputPassword
					validation="required"
					label="Password"
					name="password"
					:attributes="{
						placeholder: 'Password',
					}"
				/>

                 </div>
				
				<Button class=" h-16 rounded-md text-base font-bold" :pending="req.pending.value" @click.prevent="submit(loginUser)" type="primary">
					Login
				</Button>
			</Form>
		</div>
  </div>
</template>