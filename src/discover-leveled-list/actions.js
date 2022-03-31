
// import { isObjectEqual, isObjectValid } from './helpers.js'
import { createHttpEffect } from '@servicenow/ui-effect-http'

const actions = {
  'DIS_RELATED_REQUESTED#JOIN': createHttpEffect('api/now/table/:table', {
    // batch: false,
    method: 'GET',
    headers: {
      Accepts: 'application/json',
      'Content-Type': 'application/json'
    },
    pathParams: ['table'],
    queryParams: ['sysparm_query'],
    successActionType: 'DIS_RELATED_REQUESTED#JOIN_SUCCESS'
  }),
  'DIS_RELATED_DETAILS_REQUESTED#SEARCH': createHttpEffect('api/now/table/:table', {
    batch: false,
    method: 'GET',
    headers: {
      Accepts: 'application/json',
      'Content-Type': 'application/json'
    },
    pathParams: ['table'],
    queryParams: ['sysparm_query', 'sysparm_fields'],
    successActionType: 'DIS_RELATED_DETAILS_REQUESTED#SEARCH_SUCCESS'
  }),
  DIS_RELATED_REQUESTED: ({ action, dispatch, updateProperties, properties, state }) => {
    const { record } = action.payload
    const relatedJoinTable = properties.relatedJoinTable
    const relatedParentKey = properties.relatedParentKey

    const query = `${relatedParentKey}=${record.sys_id.value}`

    if (properties.debugMode) {
      console.debug('record', record)
      console.debug('query', query)
      console.debug('join table', relatedJoinTable)
    }

    if (relatedJoinTable) {
      dispatch('DIS_RELATED_REQUESTED#JOIN', {
        table: relatedJoinTable,
        sysparm_query: query
      })
    }
  },
  'DIS_RELATED_REQUESTED#JOIN_SUCCESS': ({ action, dispatch, updateProperties, properties, state }) => {
    const { result } = action.payload

    if (properties.debugMode) {
      console.debug('join table records', result)
    }

    if (result.length) {
      dispatch('DIS_RELATED_DETAILS_REQUESTED', { result })
    }
  },
  DIS_RELATED_DETAILS_REQUESTED: ({ action, dispatch, updateProperties, properties, state }) => {
    const { result } = action.payload

    if (properties.debugMode) {
      console.debug('details requested for', result)
    }

    if (result.length) {
      const relatedRecords = result.map(record => `sys_id=${record[properties.relatedChildKey].value}`)
      const query = relatedRecords.join('^OR')
      dispatch('DIS_RELATED_DETAILS_REQUESTED#SEARCH', {
        table: properties.relatedTable,
        sysparm_fields: properties.relatedFields,
        sysparm_query: query
      })
    }
  },
  'DIS_RELATED_DETAILS_REQUESTED#SEARCH_SUCCESS': ({ action, dispatch, updateProperties, properties, state }) => {
    const { result } = action.payload

    if (properties.debugMode) {
      console.debug('related rows', result)
    }

    if (result.length) {
      const record = state.selected
      record._related = result
    }
  },
  'NOW_PAGINATION_CONTROL#SELECTED_PAGE_SET': ({ action, properties, state, updateState }) => {
    const { value } = action.payload

    if (properties.debugMode) {
      console.debug('page val', value)
    }
    updateState({ selectedPage: value })
    if (value !== state.selectedPage) {
      updateState({
        path: 'selectedParent',
        value: [],
        operation: 'set'
      })
      updateState({
        path: 'selectedRelated',
        value: [],
        operation: 'set'
      })
    }
  },
  'NOW_PAGINATION_CONTROL#SELECTED_PAGE_SIZE_SET': ({ action, properties, updateState }) => {
    const { value } = action.payload

    if (properties.debugMode) {
      console.debug('page size val', value)
    }
    updateState({ selectedPageSize: value })
  },
  'NOW_DROPDOWN_CUSTOM_TARGET#ITEM_CLICKED': ({ action, dispatch, properties, state, updateState }) => {
    const { item } = action.payload
    if (properties.debugMode) {
      console.debug('action item clicked', item)
      console.debug('action payload', action.payload)
    }
    if (item.type && item.type === 'related') {
      dispatch('LEVELED_LIST_RELATED_ACTION_CLICKED', {
        relatedActionItemClicked: item,
        selectedRelated: state.selectedRelated.filter(record => record[properties.relatedParentKey] === state.selectedChild.sys_id.value),
        table: properties.relatedTable
      })
    } else {
      dispatch('LEVELED_LIST_ACTION_CLICKED', {
        actionItemClicked: item,
        selectedParent: state.selectedParent,
        table: properties.table
      })
    }
  }
  // LEVELED_LIST_ACTION_CLICKED: ({ action, properties, updateState }) => {
  //   if (properties.debugMode) {
  //     console.debug('leveled list ACTION PAYLOAD', action.payload)
  //   }
  // },
  // LEVELED_LIST_RELATED_ACTION_CLICKED: ({ action, properties, updateState }) => {
  //   if (properties.debugMode) {
  //     console.debug('leveled list RELATED ACTION PAYLOAD', action.payload)
  //   }
  // },
  // LEVELED_LIST_DATA_REFRESH: ({ action, properties, updateState }) => {
  //   if (properties.debugMode) {
  //     console.debug('data refresh called')
  //   }
  // },
  // LEVELED_LIST_ROW_CLICKED: ({ action, properties, updateState }) => {
  //   if (properties.debugMode) {
  //     console.debug('data refresh called')
  //   }
  // }
}

export { actions }
