import { ideaService } from '@/services/ideaService'
import { IdeaStatus, IdeaCategory } from '@/types'

export type TestLogger = (
  message: string,
  type?: 'info' | 'success' | 'error',
) => void

export async function testIdeaLifecycle(log: TestLogger) {
  const userId = 'test-user-' + Math.random().toString(36).substring(7)
  log(`Iniciando teste de ciclo de vida para usuário: ${userId}`, 'info')

  // 1. Create
  log('Criando nova ideia...', 'info')
  const newIdea = await ideaService.createIdea({
    title: 'Persistence Test Idea',
    summary: 'Automated test idea',
    description: 'Testing 123',
    status: 'inbox' as IdeaStatus,
    category: 'experimento' as IdeaCategory,
    impact: 3,
    effort: 3,
    tags: [],
    userId,
  })

  if (!newIdea?.id) throw new Error('Falha ao criar ideia: ID não retornado')
  log(`Ideia criada com ID: ${newIdea.id}`, 'success')

  // 2. Retrieve
  log('Recuperando ideia do armazenamento...', 'info')
  const fetched = await ideaService.getIdea(newIdea.id)
  if (!fetched) throw new Error('Ideia não encontrada no armazenamento')
  if (fetched.title !== 'Persistence Test Idea')
    throw new Error(`Divergência no título: ${fetched.title}`)
  log('Recuperação de ideia verificada', 'success')

  // 3. Update
  log('Atualizando status e título...', 'info')
  await ideaService.updateIdea(newIdea.id, {
    status: 'em_analise' as IdeaStatus,
    title: 'Updated Test Idea',
  })

  const updated = await ideaService.getIdea(newIdea.id)
  if (updated?.status !== 'em_analise')
    throw new Error('Falha na atualização de status')
  if (updated?.title !== 'Updated Test Idea')
    throw new Error('Falha na atualização de título')
  log('Atualização de ideia verificada', 'success')

  return newIdea.id
}

export async function testChecklistPersistence(
  ideaId: string,
  log: TestLogger,
) {
  log(`Iniciando teste de Checklist para Ideia: ${ideaId}`, 'info')

  // 1. Add Item
  log('Adicionando item ao checklist...', 'info')
  const item = await ideaService.addChecklistItem(ideaId, 'Test Task 1')
  if (!item?.id) throw new Error('Falha ao adicionar item')
  log(`Item adicionado: ${item.label}`, 'success')

  // 2. Verify Persistence
  log('Verificando armazenamento do checklist...', 'info')
  let items = await ideaService.getChecklist(ideaId)
  if (!items.find((i) => i.id === item.id))
    throw new Error('Item não encontrado')

  // 3. Toggle Item
  log('Alternando status do item...', 'info')
  await ideaService.updateChecklistItem(ideaId, item.id, { done: true })

  items = await ideaService.getChecklist(ideaId)
  const toggled = items.find((i) => i.id === item.id)
  if (!toggled?.done) throw new Error('Status do item não persistiu')
  log('Alternância de item verificada', 'success')

  // 4. Remove Item
  log('Removendo item...', 'info')
  await ideaService.removeChecklistItem(ideaId, item.id)

  items = await ideaService.getChecklist(ideaId)
  if (items.find((i) => i.id === item.id))
    throw new Error('Remoção de item falhou')
  log('Remoção de item verificada', 'success')
}

export async function testSnapshotPersistence(ideaId: string, log: TestLogger) {
  log(`Iniciando teste de Snapshot para Ideia: ${ideaId}`, 'info')

  const snapshotTitle = 'Test Snapshot V1'

  // 1. Create Snapshot
  log('Criando snapshot...', 'info')
  await ideaService.createSnapshot(ideaId, {
    id: 'snap-' + Math.random(),
    title: snapshotTitle,
    createdAt: new Date().toISOString(),
    data: {
      ideaTitle: 'Snapshot Test',
      ideaSummary: 'Summary',
      lastState: null,
      checklist: [],
      references: [],
    },
  })

  // 2. Verify
  log('Verificando armazenamento de snapshot...', 'info')
  const snapshots = await ideaService.getSnapshots(ideaId)
  const saved = snapshots.find((s) => s.title === snapshotTitle)

  if (!saved) throw new Error('Snapshot não encontrado')
  log('Snapshot persistido com sucesso', 'success')

  // 3. Update Snapshot
  log('Atualizando título do snapshot...', 'info')
  await ideaService.updateSnapshot(ideaId, saved.id, {
    title: 'Updated Snapshot V1',
  })

  const updatedSnapshots = await ideaService.getSnapshots(ideaId)
  const updated = updatedSnapshots.find((s) => s.id === saved.id)
  if (updated?.title !== 'Updated Snapshot V1')
    throw new Error('Atualização de snapshot falhou')
  log('Atualização de snapshot verificada', 'success')
}

export async function testContinuityPersistence(
  ideaId: string,
  log: TestLogger,
) {
  log(`Iniciando teste de Continuidade para Ideia: ${ideaId}`, 'info')

  // 1. Save Last State
  log('Salvando último estado...', 'info')
  const lastState = {
    whereIStopped: 'Testing phase',
    whatIWasDoing: 'Running validations',
    nextStep: 'Complete report',
    updatedAt: new Date().toISOString(),
  }

  await ideaService.saveLastState(ideaId, lastState)

  // 2. Verify Last State
  log('Verificando último estado...', 'info')
  const fetchedState = await ideaService.getLastState(ideaId)
  if (fetchedState?.whereIStopped !== lastState.whereIStopped)
    throw new Error('Divergência no último estado')
  log('Último estado verificado', 'success')

  // 3. Save References
  log('Salvando referências...', 'info')
  const links = [{ id: 'link-1', title: 'Google', url: 'https://google.com' }]
  await ideaService.saveReferences(ideaId, links)

  // 4. Verify References
  log('Verificando referências...', 'info')
  const fetchedLinks = await ideaService.getReferences(ideaId)
  if (!fetchedLinks.find((l) => l.url === links[0].url))
    throw new Error('Link de referência não encontrado')
  log('Referências verificadas', 'success')
}
