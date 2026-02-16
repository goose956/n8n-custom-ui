// Node schema registry for n8n custom UI
// Extend this with more node types as needed

export const nodeSchemas = {
'@n8n/n8n-nodes-langchain.agent': {
 displayName:'AI Agent',
 parameters: [
 {
 name:'chatModel',
 label:'Chat Model Node',
 type:'string',
 required: true,
 description:'Node ID of the chat model (e.g., OpenAI Chat node)'
 },
 {
 name:'tools',
 label:'Tools Node(s)',
 type:'string[]',
 required: true,
 description:'Node IDs of tools to use'
 },
 {
 name:'memory',
 label:'Memory Node',
 type:'string',
 required: true,
 description:'Node ID of the memory node'
 },
 {
 name:'prompt',
 label:'Prompt',
 type:'string',
 required: false,
 description:'System prompt for the agent'
 }
 ]
 },
'@n8n/n8n-nodes-langchain.chatOpenAI': {
 displayName:'OpenAI Chat',
 parameters: [
 {
 name:'model',
 label:'Model',
 type:'string',
 required: true,
 description:'OpenAI model name (e.g., gpt-3.5-turbo)'
 },
 {
 name:'apiKey',
 label:'OpenAI API Key',
 type:'string',
 required: true,
 description:'Your OpenAI API key'
 }
 ]
 },
'@n8n/n8n-nodes-langchain.tools': {
 displayName:'Tools',
 parameters: [
 {
 name:'toolType',
 label:'Tool Type',
 type:'string',
 required: true,
 description:'Type of tool (e.g., search)'
 }
 ]
 },
'@n8n/n8n-nodes-langchain.memory': {
 displayName:'Memory',
 parameters: [
 {
 name:'memoryType',
 label:'Memory Type',
 type:'string',
 required: true,
 description:'Type of memory (e.g., buffer)'
 }
 ]
 },
'n8n-nodes-base.formTrigger': {
 displayName:'Form Trigger',
 parameters: []
 }
};
