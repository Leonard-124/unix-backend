import feedback from '../Models/feedback.js'

export const getFeedback = async(req, res) => {
    try {
        const getAll = await feedback.find().sort({createdAt: -1})
        res.json(getAll)
    } catch (err) {
        res.status(500).json({error: err.message })
    }
}

export const uploadFeedback = async(req, res) => {
    try{
        const {email, message} = req.body;
        if(!email || !message) {
            return res.status(404).json({message: "All fields are required"})
        }
        const newupload = new feedback({email, message})
        const saveupload = await newupload.save()
        res.status(201).json(saveupload)

    } catch (err) {
        console.error("Error saving personal details")
        res.status(500).json({error: err.message})
    }
}