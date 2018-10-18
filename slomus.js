// Slomux - реализация Flux, в которой, как следует из нвазвания, что-то сломано.
// Нужно выяснить, что здесь сломано

const createStore = (reducer, initialState) => {
  let currentState = initialState
  const listeners = []

  const getState = () => currentState
  const dispatch = action => {
    currentState = reducer(currentState, action)
    listeners.forEach(listener => listener())
  }

  const subscribe = listener => listeners.push(listener)

  return { getState, dispatch, subscribe }
}

const connect = (mapStateToProps, mapDispatchToProps) =>
  Component => {
    return class extends React.Component {
      render() {
        return (
          <Component
            {...this.props} // 1: Необходимо добавить собственные свойства компонента
            {...mapStateToProps(store.getState(), this.props)}
            {...mapDispatchToProps(store.dispatch, this.props)}
          />
        )
      }

      componentDidMount() {
        store.subscribe(this.handleChange)
      }

      handleChange = () => {
        this.forceUpdate()
      }
    }
  }

class Provider extends React.Component {
  componentWillMount() {
    window.store = this.props.store // Теоретически, в случае использования двух и более экземпляров компонента, перетрет store.
  }

  render() {
    return this.props.children
  }
}

// APP

// actions
const ADD_TODO = 'ADD_TODO'

// action creators
const addTodo = todo => ({
  type: ADD_TODO,
  payload: todo,
})

// reducers
const reducer = (state = [], action) => {
  switch(action.type) {
    case ADD_TODO:
      return [...state, action.payload] // 2: Immutability, дабы можно было использовать поверхностное сравнение
    default:
      return state
  }
}

// components
class ToDoComponent extends React.PureComponent { // 3: PureComponent обеспечит более оптимальную реализацию shouldComponentUpdate, чем просто Component
  state = {
    todoText: ''
  }

  render() {
    const { title, todos } = this.props // Косметические изменения
    const { todoText } = this.state

    return (
      <div>
        <label>{title || 'Без названия'}</label>
        <div>
          <input
            value={todoText}
            placeholder="Название задачи"
            onChange={this.updateText}
          />
          <button onClick={this.addTodo}>Добавить</button>
          <ul>
            {todos.map((todo, idx) => <li key={idx}>{todo}</li>)} {/* 4: Добавим key, чтобы реакт не перерисовывал существующую часть списка */}
          </ul>
        </div>
      </div>
    )
  }

  updateText = (e) => { // 5: Используем стрелочные функции, чтобы иметь корректный контекст
    const { value } = e.target

    this.setState({ todoText: value }) // 6: Корректное обновление state
  }

  addTodo = () => {
    const { todoText } = this.state // Косметические изменения
    const { addTodo } = this.props
    addTodo(todoText)

    this.setState({ todoText: '' }) // 6: Корректное обновление state
  }
}

// Косметические изменения, но делают код более читаемым
const mapStateToProps = state => ({
  todos: state
})

const mapDispatchToProps = dispatch => ({
  addTodo: text => dispatch(addTodo(text)),
})

const ToDo = connect(mapStateToProps, mapDispatchToProps)(ToDoComponent)

// init
ReactDOM.render(
  <Provider store={createStore(reducer, [])}>
    <ToDo title="Список задач"/>
  </Provider>,
  document.getElementById('app')
)
