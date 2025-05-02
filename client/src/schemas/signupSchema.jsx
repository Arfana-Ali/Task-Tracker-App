import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  country: z.string().min(1, "Please select a country."),
  avatar: z.any().refine((file) => file && file instanceof File, {
    message: "Avatar is required and must be a file.",
  }),
});

export { signupSchema };
