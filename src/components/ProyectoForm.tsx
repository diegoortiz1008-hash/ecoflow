import { useId, useState, type FormEvent } from 'react'
import type { Instalador, NuevoProyecto } from '../types/domain'
import { EMPTY_PROYECTO, validateProyecto, type ProyectoFormErrors, type ProyectoFormValues } from '../utils/validation'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Field, Input, Select } from './ui/field'

interface Props {
  instaladores: Instalador[]
  onSubmit: (data: NuevoProyecto) => Promise<{ ok: true } | { ok: false; error: string }>
  onCancel: () => void
}

/** Formulario de nuevo proyecto (UI-2): valida RN-1, RN-2 y RN-5 antes de llamar a Supabase. */
export function ProyectoForm({ instaladores, onSubmit, onCancel }: Props) {
  const uid = useId()
  const id = (f: keyof ProyectoFormValues) => `${uid}-${f}`
  const [values, setValues] = useState<ProyectoFormValues>(EMPTY_PROYECTO)
  const [errors, setErrors] = useState<ProyectoFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const set = (f: keyof ProyectoFormValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [f]: e.target.value }))
    if (errors[f]) setErrors((x) => ({ ...x, [f]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const { errors: found, data } = validateProyecto(values, instaladores)
    setErrors(found)
    if (!data) {
      const first = Object.keys(found)[0] as keyof ProyectoFormValues
      document.getElementById(id(first))?.focus()
      return
    }
    setEnviando(true)
    const res = await onSubmit(data)
    setEnviando(false)
    if (res.ok) {
      setValues(EMPTY_PROYECTO)
      onCancel()
    } else setServerError(res.error)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo proyecto</CardTitle>
        <CardDescription>Los campos se validan con las mismas reglas que la base de datos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={submit} className="space-y-4">
          <fieldset disabled={enviando} className="grid gap-4 sm:grid-cols-2">
            <Field id={id('nombre')} label="Nombre del proyecto" error={errors.nombre}>
              <Input id={id('nombre')} value={values.nombre} onChange={set('nombre')} error={errors.nombre} placeholder="Techo solar planta sur" maxLength={150} />
            </Field>
            <Field id={id('cliente')} label="Cliente" error={errors.cliente}>
              <Input id={id('cliente')} value={values.cliente} onChange={set('cliente')} error={errors.cliente} placeholder="Empresa S.A.S." maxLength={150} />
            </Field>
            <Field id={id('ciudad')} label="Ciudad" error={errors.ciudad}>
              <Input id={id('ciudad')} value={values.ciudad} onChange={set('ciudad')} error={errors.ciudad} placeholder="Cali" maxLength={80} />
            </Field>
            <Field id={id('direccion')} label="Dirección (opcional)" error={errors.direccion}>
              <Input id={id('direccion')} value={values.direccion} onChange={set('direccion')} error={errors.direccion} maxLength={250} />
            </Field>
            <Field id={id('capacidadKw')} label="Capacidad (kW)" error={errors.capacidadKw} hint="Entre 0 y 10.000 kW">
              <Input id={id('capacidadKw')} type="number" inputMode="decimal" step="0.01" min="0" value={values.capacidadKw} onChange={set('capacidadKw')} error={errors.capacidadKw} />
            </Field>
            <Field id={id('instaladorId')} label="Instalador" error={errors.instaladorId} hint="Opcional: puede asignarse después">
              <Select id={id('instaladorId')} value={values.instaladorId} onChange={set('instaladorId')} error={errors.instaladorId}>
                <option value="">Sin asignar</option>
                {instaladores.map((i) => (
                  <option key={i.id} value={i.id}>{i.nombre} · {i.certificacion}{i.activo ? '' : ' (inactivo)'}</option>
                ))}
              </Select>
            </Field>
            <Field id={id('fechaInicio')} label="Fecha de inicio" error={errors.fechaInicio}>
              <Input id={id('fechaInicio')} type="date" value={values.fechaInicio} onChange={set('fechaInicio')} error={errors.fechaInicio} />
            </Field>
            <Field id={id('fechaFinEstimada')} label="Fin estimado" error={errors.fechaFinEstimada}>
              <Input id={id('fechaFinEstimada')} type="date" value={values.fechaFinEstimada} onChange={set('fechaFinEstimada')} error={errors.fechaFinEstimada} />
            </Field>
          </fieldset>

          {serverError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{serverError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Crear proyecto'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
