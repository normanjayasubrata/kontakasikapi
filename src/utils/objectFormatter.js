const propertySelector = (model, template) => {
    if (!model) {
        throw new Error('No model provided')
    }
    if (!template) {
        throw new Error('No template provided')
    }
    const newObject = {};
    template.map( property => {
        newObject[property] = model[property]
    })
    return newObject;
}


const emptyPropertyRemover = inputObject => {
    const arrayObject = Object.entries(inputObject);
    const returnedObject = arrayObject.filter(property => property[1] && property[1].trim() !== '')
    return Object.fromEntries(returnedObject)
}


module.exports = {
    propertySelector,
    emptyPropertyRemover
}