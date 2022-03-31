import { createCustomElement } from '@servicenow/ui-core'
import snabbdom from '@servicenow/ui-renderer-snabbdom'
import { actions } from './actions'
import { view } from './view'
import styles from './styles.scss'

createCustomElement('discover-leveled-list', {
  actionHandlers: actions,
  initialState: {
    selected: {},
    selectedChild: {},
    selectedSort: {
      key: '',
      asc: true
    },
    selectedParent: [],
    selectedRelated: [],
    isAlertOpen: false,
    selectedPage: 0,
    selectedPageSize: 10
  },
  properties: {
    debugMode: {
      default: false
    },
    data: {
      default: []
    },
    table: {
      default: ''
    },
    fields: {
      default: ''
    },
    actionItems: {
      default: '[]'
    },
    relatedTable: {
      default: ''
    },
    relatedFields: {
      default: ''
    },
    relatedJoinTable: {
      default: ''
    },
    relatedParentKey: {
      default: ''
    },
    relatedChildKey: {
      default: ''
    },
    relatedActionItems: {
      default: '[]'
    },
    relatedTableTitle: {
      default: ''
    }
  },
  renderer: { type: snabbdom },
  view,
  styles
})
