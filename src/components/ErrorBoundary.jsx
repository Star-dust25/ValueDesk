import { Component } from 'react'

/** Aísla fallos de componentes opcionales (p. ej. la escena 3D) para que no tumben la página. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.warn('[ErrorBoundary]', error)
  }

  render() {
    return this.state.error ? this.props.fallback : this.props.children
  }
}
