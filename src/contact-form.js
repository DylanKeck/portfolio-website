import {z} from 'zod'

export function contactForm () {
    const schema = z.object({
        name: z.string({required_error: 'Name is required'})
            .min(1, {message: 'Name must be at least one character'})
            .max(64, {message: 'Name cannot be greater than 64 characters'}),
        email: z.string({required_error: 'Email is required'})
            .email({message: 'Invalid email address'})
            .max(128, {message: 'Email must be less than 128 characters'}),
        message: z.string({required_error: 'Message is required'})
            .min(1, {message: 'Message must be at leat one character'})
            .max(500, {message: 'Message cannot be greater than 500 characters'}),
    })
    const form = document.getElementById('contact-form')
    const nameInput = document.getElementById('name')
    const emailInput = document.getElementById('email')
    const messageInput = document.getElementById('message')


    const nameError = document.getElementById('nameError')
    const emailError = document.getElementById('emailError')
    const messageError = document.getElementById('messageError')

    const statusOutput = document.getElementById('status')

    const successClasses = ['text-green-800', 'bg-green-50']
    const errorClasses = ['text-red-800', 'bg-red-50']

    form.addEventListener('submit', event => {
        event.preventDefault()
        const formData = new FormData(form)

        const errorArray = [nameError, emailError, messageError]
        errorArray.forEach(element => {element.classList.add('hidden')})

        const inputArray = [nameInput, emailInput, messageInput]
        inputArray.forEach(input => {input.classList.remove('border-red-500')})
        // if the website input is set a bot most likely filed out the form so provide a fake success message to trick the bot into thinking it succeeded

        if(formData.get('website') !== '') {
            form.reset()
            statusOutput.innerHTML = "Message sent successfully."
            statusOutput.classList.add(...successClasses)
            statusOutput.classList.remove('hidden')
            return
        }
        const values = Object.fromEntries(formData.entries())

        // values.subject = values.subject === '' ? undefined : values.subject

        const result =
            schema.safeParse(values)
        if (result.success === false) {
            const errorsMap = {
                name: {inputError: nameInput, errorElement: nameError},
                email: {inputError: emailInput, errorElement: emailError},
                message: {inputError: messageInput, errorElement: messageError},

            }
            result.error.errors.forEach(error => {
                const {errorElement, inputError} = errorsMap[error.path[0]]
                errorElement.innerHTML = error.message
                errorElement.classList.remove('hidden')
                inputError.classList.add('border-red-500')
            })
            return
        }
        fetch('/apis/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            .then(data => {
                statusOutput.innerHTML = data.message
                if (data.status === 200) {
                    statusOutput.classList.add(...successClasses)
                    form.reset()
                }
                statusOutput.classList.add(...errorClasses)
            })
    })

}

