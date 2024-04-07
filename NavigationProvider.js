import React, { createContext, useContext, useState } from 'react'

const PrelevatorContext = createContext({})

function PrelevatorProvider({ children }) {
    const [prel, setPrel] = useState(0)

    return (
        <PrelevatorContext.Provider value={{ prel: prel, setPrel: setPrel }}>
            {children}
        </PrelevatorContext.Provider>
    )
}

// useTemplate Hook
const useTemplate = () => {
    const context = useContext(PrelevatorContext)
    if (context === undefined)
        throw new Error('useTemplate must be used within TemplateProvider')
    return context
}

export { PrelevatorProvider, useTemplate }
