import personaldetails from "../Models/personaldetails.js";
import mongooose from "mongoose"


export const createDetails = async(req, res) => {
    try {
        const auth0Id = req.auth?.payload?.sub || req.auth?.sub;
        if(!auth0Id) {
            return res.status(401).json({error: "Unauthorized: no auth0Id"});
        }
        const {username, phone, address, country, city, postalCode} =  req.body;
        const newdetails = new personaldetails({
            username,
            phone,
            address,
            country,
            city,
            postalCode,
            auth0Id
        })
        const savedetails = await newdetails.save();
        res.status(201).json(savedetails)

    } catch (err) {
        console.error("Error saving personal details")
        res.status(500).json({error: err.message});
    }
};

export const getPersonal = async(req, res) => {
    try {
        const personal = await personaldetails.find.sort({ createdAt: -1 })
        res.status(200).json(personal)
    } catch  (error) {
        res.status(500).json({ message: error.message })
    }
};

export const getOnePersonal = async (req, res) => {
    try {
        const auth0Id = req.params.auth0Id || req.auth?.payload?.sub || req.user?.sub; //
        if(!auth0Id) {
            return res.status(400).json({message: "Not permitted, auth0Id must be provided"})
        }
        const personal = await personaldetails.findById(req.params.id);
        if (!personal) return res.status(404).json({message: "No personal details found"});
        res.status(200).json(personal)

    } catch (error) {
        res.status(500).json({message: error.message})
    }
};


export const updatePersonal = async(req, res) => {
    try {
        const auth0Id = req.params.auth0Id || req.auth?.payload?.sub || req.user?.sub
        if (!auth0Id) {
            return res.status(400).json({message: "Invalid auth0Id format"})
        }
        const updated  = await personaldetails.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) return res.status(404).json({message: "No details found"});
        res.status(200).json(updated);

    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

export const deletePersonal = async ( req, res) => {
    try {
        const auth0IdFromtoken = req.auth?.payload?.sub || req.auth?.sub;
        if (!auth0IdFromtoken) {
            return res.status(401).json({ error: "Unauthorized"})
        }
        const personal = await personaldetails.findById(req.params.id);
        if(!personal) return res.status(404).json({ error: "Not found"});

        await personaldetails.deleteOne();
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        console.error("Error deleting your personal details", err);
        res.status(500).json({error: err.message })
    }
}
