var Ticket = require('../models/ticket');

// app/models/fanpage.js
// load dependencies
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

// define the model schema
var fanpageSchema = mongoose.Schema({
    _id: String,
    theme: {
        /* deprecated theme fields */
        css: String,
        navbar: String,
        
        /* new theme fields */
        name: String,
        colour: String
    },
    cover: {
        path: String,
        height: Number
    },
    logo: {
        path: String,
        width: Number,
        margin: Number,
        hide_title: Boolean
    },
    facebook: {
        id: String,
        name: String,
        about: String,
        description: String,
        picture: String,
        cdn: String,
        category: String,
        category_list: [{
            _id: String,
            name: String
        }],
        is_verified: Boolean,
        link: String,
        website: String,
        emails: [String],
        stats: {
            checkins: Number,
            likes: Number,
            talking_about_count: Number,
            were_here_count: Number
        },
        place: {
            name_with_location_descriptor: String,
            phone: String,
            location: {
                street: String,
                city: String,
                state: String,
                country: String,
                zip: String,
                coordinates: {type: [], index: '2d'}
            },
            parking: {
                lot: Number,
                street: Number,
                valet: Number
            }
        },
        info: {
            general_info: String,
            hours: [String],
            impressum: String,
            band: {
                band_members: String,
                booking_agent: String,
                press_contact: String,
                hometown: String,
                record_label: String
            },
            company: {
                company_overview: String,
                founded: String,
                mission: String
            },
            film: {
                directed_by: String
            },
            foodnight: {
                attire: String,
                general_manager: String,
                price_range: String,
                restaurant: {
                    services: {
                        kids: Boolean,
                        delivery: Boolean,
                        walkins: Boolean,
                        catering: Boolean,
                        reserve: Boolean,
                        groups: Boolean,
                        waiter: Boolean,
                        outdoor: Boolean,
                        takeout: Boolean
                    },
                    specialties: {
                        coffee: Boolean,
                        drinks: Boolean,
                        breakfast: Boolean,
                        dinner: Boolean,
                        lunch: Boolean
                    }
                }
            },
            personality: {
                birthday: Date
            },
            payment_options: {
                amex: Boolean,
                cash_only: Boolean,
                discover: Boolean,
                mastercard: Boolean,
                visa: Boolean
            }
        }
    },
    creation: {
        time : Date,
        user : { type: String, ref: 'User' }
    },
    billing: {
        active: Boolean,
        evaluation: Boolean,
        expiration: Date
    },
    video_count: Number,
    url: String,
    wizard: {
        current_step: Number,
        site_created: Boolean,
        personal_touch: Boolean,
        share_it: Boolean,
        finished: Boolean
    },
    jobs: {
        new_site_created: Date,
        update_page_info: Date,
        update_profile_picture: Date,
        sync_feeds: Date,
        sync_albums: Date,
        sync_videos: Date,
        count_stuff: Date,
        welcome_email: Date,
        page_ratings: Date,
        page_ratings_avg: Date
    },
    custom: {
        display_name: String,
        about_page: String
    },
    error: {
        time: Date,
        request: String,
        info: String
    },
    ratings: [{
        reviewer: String,
        rating: Number
    }],
    ratings_average: Number
});

// export user model
module.exports = mongoose.model('Fanpage', fanpageSchema);