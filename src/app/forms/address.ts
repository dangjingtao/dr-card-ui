import { z } from 'zod'

import { ADDRESS_FORM_COPY } from '../fixtures/addressOrders'

export const addressFieldsSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, ADDRESS_FORM_COPY.nameError),
  phone: z.string().refine((value) => /^1\d{10}$/.test(value.trim()), ADDRESS_FORM_COPY.phoneError),
  region: z.string().refine((value) => value.trim().length > 0, ADDRESS_FORM_COPY.regionError),
  detail: z.string().refine((value) => value.trim().length > 0, ADDRESS_FORM_COPY.detailError),
})

export const addressFormSchema = addressFieldsSchema.extend({
  isDefault: z.boolean(),
})

export type AddressFormValue = z.infer<typeof addressFieldsSchema>
export type AddressFormData = z.infer<typeof addressFormSchema>
