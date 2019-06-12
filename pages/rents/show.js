import React, { Component } from 'react';
import {
    Form, 
    Message, 
    Card, 
    Grid, 
    Button, 
    Header, 
    Icon, 
    Segment, 
    Divider, 
    Rating, 
    Label,
    Modal,
    Image,
    Accordion,
    Checkbox,
    Comment,
    Container,
    Table,
    Input
} from 'semantic-ui-react';
import moment from 'moment';
import { ethers } from 'ethers';
import Layout from '../../components/Layout';
import factory from '../../ethereum/factory';
import Rental from '../../ethereum/rental';
import Profile from '../../ethereum/profile';
import web3 from '../../ethereum/web3';
import { Link, Router } from '../../routes';
import { convertToImage, getString, getIpfsHash } from '../../utils/ipfs';

//var files_array = [];

class RentalShow extends Component {

    state = {
        errorMessagePublish: '',
        successMessagePublish: '',
        loadingPublish: false,
        disabledPublish: false,
        errorMessageWithdraw: '',
        successMessageWithdraw: '',
        loadingWithdraw: false,
        disabledWithdraw: false,
        errorMessageRent: '',
        successMessageRent: '',
        loadingRent: false,
        disabledRent: false,
        errorMessagePayment: '',
        successMessagePayment: '',
        loadingPayment: false,
        disabledPayment: false,
        errorMessageOverdue: '',
        successMessageOverdue: '',
        loadingOverdue: false,
        disabledOverdue: false,
        successRating: '',
        errorRating: '',
        loadingRating: false,
        inputRatingButton: false,
        showRatingModal: false,
        showReclaimOption: false,
        loading: true,
        isOwner: false,
        isRenter: false,
        loadingFile: false,
        buffer: null,
        fileUrl: '',
        reply: '',
        files_array: [],
        fileHashes_array: [],
        answerList: [],
        replyText_arr: [],
        fileNames_array: [],
        popUpRating: false,
        popUpReply: false,
        popUpRatingQuestion: false,
        errorMessageRatingQuestion: '',
        successMessageRatingQuestion: '',
        loadingRatingQuestion: false,
        disabledRatingQuestion: false,
        popUpRatingAnswer: false,
        loadingRatingAnswer: false,
        errorMessageRatingAnswer: '',
        disabledRatingAnswer: false,
        rating: 0, //current rating
        submitRate: false, //for question,
        submitRateAnswer: false,
        totalRating: 0,
        totalDeposit: 0,
        totalRatingAnswer: 0,
        ratingAnswer: 0,
        currentIndexAnswer: -1
    };

    static async getInitialProps(props) {
        const rent = Rental(props.query.address);
        const inState = await rent.methods.getState().call();
        const summary = await rent.methods.getSummary().call();
        const time = await rent.methods.getTime().call();
        const profileOwner = await factory.methods.getProfile(summary[5]).call();
        const totalFee = await rent.methods.totalRentingFee().call();
        const allowOverdue = await rent.methods.allowOverdue().call();
        const openDisputeR = await rent.methods.openDisputeRenter().call();
        const openDisputeO = await rent.methods.openDisputeOwner().call();
        // const imageHash = await rent.methods.imageHashes().call();
        // const image = imageHash == '0' ? 0 : await convertToImage('Qm'+imageHash);
        const fileHashesQuestion = summary[7];
        const fileNamesQuestion = summary[8];
        
        const initialTotalRating = await rent.methods.returnRatingQuestion().call();
        const iconList = ['alligator', 'anteater', 'armadillo', 'auroch', 'axolotl',
        'badger', 'bat', 'beaver', 'buffalo', 'camel', 'capybara',
        'chameleon', 'cheetah', 'chinchilla', 'chipmunk', 'chupacabra',
        'cormorant', 'coyote', 'crow', 'dingo', 'dinosaur', 'dolphin',
        'duck', 'elephant', 'ferret', 'fox', 'frog', 'giraffe', 'gopher',
        'grizzly', 'hedgehog', 'hippo', 'hyena', 'ibex', 'ifrit', 'iguana',
        'jackal', 'kangaroo', 'koala', 'kraken', 'lemur', 'leopard',
        'liger', 'llama', 'manatee', 'mink', 'monkey', 'moose', 'narwhal',
        'orangutan', 'otter', 'panda', 'penguin', 'platypus',
        'pumpkin', 'python', 'quagga', 'rabbit', 'raccoon', 'rhino',
        'sheep', 'shrew', 'skunk', 'squirrel', 'tiger', 'turtle', 'walrus',
        'wolf', 'wolverine', 'wombat'];
        const avatarListIcon = iconList.map((item)=>{
            return 'https://ssl.gstatic.com/docs/common/profile/' + item + '_lg.png';
        });
        const avatarListName = iconList.map((item)=>{
            return 'anonymous ' + item;
        });
        // const iconUrl = 'https://ssl.gstatic.com/docs/common/profile/' + iconList[randNum] + '_lg.png';
        // const iconName = 'anonymous ' + iconList[randNum];
        const answerList = await rent.methods.getAnswerList().call();
        let ratingAnswerList = [];
        var i;
        for (i=0; i<answerList.length; i++){
            ratingAnswerList.push(answerList[i].answerRate);
        }
        return { 
            address: props.query.address,
            inState: inState,
            productName: summary[0],
            description: await getString('Qm'+summary[1]),
            rentalFee: ethers.utils.formatUnits(summary[2], "ether"),
            initialDeposit: ethers.utils.formatUnits(summary[3], "ether"),
            maxDuration: summary[4],
            owner: summary[5],
            renter: summary[6],
            time: time,
            profileOwner: profileOwner,
            totalFee: ethers.utils.formatUnits(totalFee, "ether"),
            allowOverdue: allowOverdue,
            openDisputeO: openDisputeO,
            openDispute: openDisputeR || openDisputeO,
            // image: image,
            initialTotalRating: initialTotalRating,
            avatarListIcon: avatarListIcon,
            avatarListName: avatarListName,
            ratingAnswerList: ratingAnswerList,
            fileHashesQuestion: fileHashesQuestion,
            fileNamesQuestion: fileNamesQuestion
        };
    }

    async componentDidMount() {
        const accounts = await web3.eth.getAccounts();
        if(accounts[0] == this.props.owner){
            this.setState({ isOwner: true });
        }else if(accounts[0] == this.props.renter){
            this.setState({ isRenter :true });
        }

        const rent = Rental(this.props.address);
        const answerList = await rent.methods.getAnswerList().call();
        this.setState({ answerList: answerList});
        

        let {replyText_arr} = this.state;
        var i;
        for (i = 0 ; i < answerList.length ; i++) {
            let replyText = await getString('Qm'+answerList[i].replyHash)
            console.log("await getString('Qm'+item.replyHash)", replyText);
            replyText_arr.push(replyText);
        }
        this.setState({ replyText_arr: replyText_arr });

        console.log("this.state.replyText_arr: ", this.state.replyText_arr);
        
        console.log("this.state.answerList: ", this.state.answerList);

        this.setState({ loading:false });
    }

    onSubmitPublish = async (event) => {
        event.preventDefault();
        const rent = Rental(this.props.address);

        this.setState({ loadingPublish: true, errorMessagePublish: '' });

        try {
            const accounts = await web3.eth.getAccounts();
            await rent.methods.publish().send({
                from: accounts[0]
            });

            this.setState({ disabledPublish: true, 
                successMessagePublish: "You have published the item. You can manage your item(s) in the 'Manage Items' tab" });
        } catch (err) {
            this.setState({ errorMessagePublish: err.message });
        }
        this.setState({ loadingPublish: false });
    }

    onSubmitWithdraw = async (event) => {
        event.preventDefault();
        const rent = Rental(this.props.address);

        this.setState({ loadingWithdraw: true, errorMessageWithdraw: '' });

        try {
            const accounts = await web3.eth.getAccounts();
            await rent.methods.cancelled().send({
                from: accounts[0]
            });

            this.setState({ disabledWithdraw: true, 
                successMessageWithdraw: "You have withdrawn the item. You can manage your item(s) in the 'Manage Items' tab" });
        } catch (err) {
            this.setState({ errorMessageWithdraw: err.message });
        }
        this.setState({ loadingWithdraw: false });
    }

    onSubmitRent = async (event) => {
        event.preventDefault();
        this.setState({ loadingRent: true, errorMessageRent: '' });

        try {
            const accounts = await web3.eth.getAccounts();
            await factory.methods.rentItemAt(this.props.address).send({
                from: accounts[0],
                //value: web3.utils.toWei(this.props.deposit, 'ether')
            });
            this.setState({ disabledRent: true, 
                successMessageRent: "You have borrowed the item. You can manage your item(s) in the 'Manage Items' tab" });
        } catch (err) {
            this.setState({ errorMessageRent: err.message });
        }
        this.setState({ loadingRent: false });
    }

    onSubmitPayment = async (event, dispute = false) => {
        event.preventDefault();
        const rent = Rental(this.props.address);
        const successMessage = this.state.isOwner? "Action successful. Awaiting payment from renter." : 
                                                  "Transaction successful."

        this.setState({ loadingPayment: true, errorMessagePayment: '', errorMessageOverdue: '', showReclaimOption: false });

        try {
            const accounts = await web3.eth.getAccounts();

            if(this.state.isOwner) {
                await rent.methods.reclaimItem().send({
                    from: accounts[0]
                });
                if(dispute){
                    Router.pushRoute(`/rents/${this.props.address}/dispute/new`);
                }
            } else {
                //let payableFee = web3.utils.toWei(this.props.totalFee,'ether');
                await rent.methods.returnItem().send({
                    from: accounts[0],
                    value: payableFee
                });
                this.setState({ inputRatingButton: true, showRatingModal: true });
            }

            if(dispute){
                this.setState({ disabledPayment: true });
            } else {
                this.setState({ disabledPayment: true, successMessagePayment: successMessage });
            }
        } catch (err) {
            this.setState({ errorMessagePayment: err.message });
        }
        this.setState({ loadingPayment: false });
    }

    onSubmitOverdue = async (event) => {
        event.preventDefault();
        const rent = Rental(this.props.address);

        this.setState({ loadingOverdue: true, errorMessagePayment: '', errorMessageOverdue: '' });

        try {
            const accounts = await web3.eth.getAccounts();
            await rent.methods.chargeOverdueItem().send({
                from: accounts[0]
            });

            this.setState({ disabledOverdue: true, disabledPayment: true, 
                successMessageOverdue: "Action successful. Deposit received. This item will be deleted." });
        } catch (err) {
            this.setState({ errorMessageOverdue: err.message });
        }
        this.setState({ loadingOverdue: false });
    }

    onSubmitRating = async (event) => {
        event.preventDefault();
        const {rating, rateDescription} = this.state;

        this.setState({ loadingRating: true, errorRating: ''});

        try {
            const accounts = await web3.eth.getAccounts();

            if(accounts[0] == this.props.renter) {
                const profileOwner = Profile(this.props.profileOwner);
                const profileRenter= await factory.methods.getProfile(this.props.renter).call();
                const role = web3.utils.asciiToHex('Renter',8);
                const historyIndex = await Rental(this.props.address).methods.historyIndex().call();
                await profileOwner.methods.inputRating(rating, rateDescription, role, this.props.address, 
                    profileRenter, historyIndex).send({
                    from: accounts[0]
                 });
            } else if(accounts[0] == this.props.owner) {
                const _profileRenter= await factory.methods.getProfile(this.props.renter).call();
                const profileRenter = Profile(_profileRenter);
                const role = web3.utils.asciiToHex('Owner',8);
                const historyIndex = await Rental(this.props.address).historyIndex().call();
                await profileRenter.methods.inputRating(rating, rateDescription, role, this.props.address, 
                    this.props.profileOwner, historyIndex).send({
                    from: accounts[0]
                 });
            }
            this.setState({successRating: "Thank you for your rating!", inputRatingButton: false, showRatingModal: false})
        } catch (err) {
            this.setState({ errorRating: err.message });
        }
        this.setState({ loadingRating: false });
    }

    onSubmitRatingQuestion = async (event)=>{
        event.preventDefault();
        this.setState({ loadingRatingQuestion: true, errorMessageRatingQuestion: '' });
        try {
            const accounts = await web3.eth.getAccounts();
            console.log(accounts[0]);
            await factory.methods.ratingQuestionAt(this.props.address, this.state.rating).send({
                from: accounts[0],
                //value: web3.utils.toWei('0.01', 'ether'),
            });
            const myRating = await Rental(this.props.address).methods.returnRatingQuestion().call();
            const myDeposit = await Rental(this.props.address).methods.getDeposit().call();
            //console.log(myDeposit);
            this.setState({ totalDeposit: myDeposit,
                        totalRating: myRating,
                        submitRate: true ,
                        disabledRatingQuestion: true
                    });
        } catch (err) {
            this.setState({ errorMessageRatingQuestion: err.message });
        } 
        this.setState({ loadingRatingQuestion: false ,
                        popUpRatingQuestion: false});
        console.log("hahaa");   
    }

    onSubmitRatingAnswer = async (event, index)=>{
        event.preventDefault();
        this.setState({ loadingRatingAnswer: true, errorMessageRatingAnswer: '' });
        try {
            const accounts = await web3.eth.getAccounts();
            await factory.methods.ratingAnswerAt(this.props.address, this.state.ratingAnswer, index).send({
                from: accounts[0],
            });
            const myRating = await Rental(this.props.address).methods.getAnswerRate(index).call();
            this.setState({ 
                        totalRatingAnswer: myRating,
                        loadingRatingAnswer: false,
                        submitRateAnswer: true,     
                    });
        } catch (err) {
            this.setState({ errorMessageRatingAnswer: err.message });
        } 
        this.setState({ popUpRatingAnswer: false ,
                        disabledRatingAnswer: true })
        console.log("hahaa");   
    }

    renderCards() {
        const {
            address,
            productName,
            description,
            rentalFee,
            deposit,
            maxDuration,
            owner,
            profileOwner
        } = this.props;

        const items = [
            {
                header: productName,
                meta: 'Product Name',
                description: description,
            },
            {
                header: address,
                meta: 'Product ID',
                description: 'A unique product ID attached to this product',
                style: { overflowWrap: 'break-word' }
            },
            {
                header: owner,
                meta: 'Address of Owner',
                description: (
                    <React.Fragment>
                        <Link route={`/profile/${profileOwner}`}> 
                            <a>View Profile</a> 
                        </Link>
                        <p>The owner created the contract and specified the details of the rent</p>
                    </React.Fragment>
                ),
                style: { overflowWrap: 'break-word' }
            },
            {
                header: ((rentalFee * 60 * 60).toFixed(4)).toString(),
                meta: 'Rental Fee (ETH per hour)',
                description: 'The rental fee per hour. The total rental fee will be automatically calculated per second basis'
            },
            {
                header: deposit,
                meta: 'Deposit (ETH)',
                description: 'The borrower need to pay the specified amount of deposit fee to the contract. The deposit will be credited back to the borrower after the item is returned'
            },
            {
                header: (parseFloat(maxDuration) / 60 / 60).toFixed(2).toString(),
                meta: 'Maximum Duration to Rent (hour(s))',
                description: 'The maximum hour(s) available to rent. The deposit will be released to the owner if the borrower fails to return the item before the specified hours'
            }
        ];

        return <Card.Group centered items={items} />;
    }

    renderOptions(){
        const isOwner = this.state.isOwner;
        const isRenter = this.state.isRenter;
        const { inState } = this.props;

        if(inState === 'IDLE'){
            if(isOwner) {
                return(
                    <Grid.Row centered>
                        <Form onSubmit={this.onSubmitPublish} error={!!this.state.errorMessagePublish} success={!!this.state.successMessagePublish}>
                            <Form.Field>
                                <label>You are the owner of this item.</label>
                                <Button primary loading={this.state.loadingPublish} disabled={this.state.disabledPublish}>
                                    Publish This Item
                                </Button>
                            </Form.Field>

                            <Message error header="Oops!" content={this.state.errorMessagePublish}/>
                            <Message success header="Success!" content={this.state.successMessagePublish}/>
                        </Form>
                    </Grid.Row>
                );
            }
        }else if(inState === 'PUBLISHED'){
            if(isOwner) {
                return(
                    <Grid.Row centered>
                        <Form onSubmit={this.onSubmitWithdraw} error={!!this.state.errorMessageWithdraw} success={!!this.state.successMessageWithdraw}>
                            <Form.Field>
                                <label>You are the owner of this item.</label>
                                <Button primary loading={this.state.loadingWithdraw} disabled={this.state.disabledWithdraw}>
                                    Withdraw This Item
                                </Button>
                            </Form.Field>

                            <Message error header="Oops!" content={this.state.errorMessageWithdraw}/>
                            <Message success header="Success!" content={this.state.successMessageWithdraw}/>
                        </Form>
                    </Grid.Row>
                );
            } else {
                return(
                    <Grid.Row centered>
                        <Form onSubmit={this.onSubmitRent} error={!!this.state.errorMessageRent} success={!!this.state.successMessageRent}>
                            <Form.Field>
                                <label>The deposit of {this.props.deposit} ETH will be deducted from your account.</label>
                                <Button primary loading={this.state.loadingRent} disabled={this.state.disabledRent}>
                                    Borrow This Item
                                </Button>
                            </Form.Field>

                            <Message error header="Oops!" content={this.state.errorMessageRent}/>
                            <Message success header="Success!" content={this.state.successMessageRent}/>
                        </Form>
                    </Grid.Row>
                );
            }
        }else if(inState === 'RENTED' || inState === 'AWAITPAYMENT'){
            if(isOwner) {
                const overdueMessage1 = this.props.allowOverdue ? 'Retrieve deposit from overdue item' : 'You cannot claim the item yet';
                const timeToOverdue = moment.unix(parseInt(this.props.time[0]) + parseInt(this.props.time[2])).fromNow(true);
                const overdueMessage2 = this.props.openDispute ? (<React.Fragment><span style={{color: 'red'}}>A dispute is ongoing</span></React.Fragment>) : 
                                             ( <React.Fragment>Please try again in <span style={{color: 'red'}}>{timeToOverdue.toUpperCase()}</span></React.Fragment>);
                const panels = [
                    {
                        key: 'not-satisfied-with-item',
                        title: 'Do you have issue with the returned item?',
                        content: [
                            'If you are not satisfied with the returned item and wish to request for a compensation,',
                            'you can open a dispute which will be published to public by voting. Note that extra charges',
                            'such as voters\' incentives may apply. Please RECLAIM the item first and choose the option to',
                            'open a new dispute.'
                        ].join(' ')
                    }
                ];
                return(
                    <React.Fragment>
                        <Grid.Row centered>
                            <Form onSubmit={() => {this.setState({showReclaimOption: true})}} error={!!this.state.errorMessagePayment} success={!!this.state.successMessagePayment}>
                                <Form.Field>
                                    <label>Received item from borrower and request for payment</label>
                                    <Button primary loading={this.state.loadingPayment} disabled={this.state.disabledPayment || this.props.inState === "AWAITPAYMENT"}>
                                        Reclaim Item
                                    </Button>
                                </Form.Field>

                                <Message error header="Oops!" content={this.state.errorMessagePayment}/>
                                <Message success header="Success!" content={this.state.successMessagePayment}/>
                            </Form>
                        </Grid.Row>

                        {this.state.successMessagePayment == '' && <Grid.Row centered style={{marginTop: -40}}>
                            <Accordion panels={panels}/>
                        </Grid.Row>}

                        {this.showReclaimOption()}

                        <Grid.Row centered>
                            <Form onSubmit={this.onSubmitOverdue} error={!!this.state.errorMessageOverdue} success={!!this.state.successMessageOverdue}>
                                <Form.Field>
                                    <label>
                                        {overdueMessage1}
                                        {!this.props.allowOverdue && 
                                            <div>{overdueMessage2}</div>
                                        }
                                    </label>
                                    <Button primary loading={this.state.loadingOverdue} disabled={this.state.disabledOverdue? this.state.disabledOverdue : !this.props.allowOverdue}>
                                        Claim Overdue Item
                                    </Button>
                                </Form.Field>

                                <Message error header="Oops!" content={this.state.errorMessageOverdue}/>
                                <Message success header="Success!" content={this.state.successMessageOverdue}/>
                            </Form>
                        </Grid.Row>
                    </React.Fragment>
                );
            } else if(inState === 'AWAITPAYMENT' && isRenter){
                return(
                    <React.Fragment>
                        <Grid.Row centered>
                            <Form onSubmit={this.onSubmitPayment} error={!!this.state.errorMessagePayment} success={!!this.state.successMessagePayment}>
                                <Form.Field>
                                    <label>{this.props.openDisputeO ? 
                                        (<React.Fragment>You cannot make payment due to <span style={{color: 'red'}}>an ongoing dispute</span></React.Fragment>) 
                                        : 'Pay rent fees and retrieve deposit'}</label>
                                    <Button primary loading={this.state.loadingPayment} disabled={this.state.disabledPayment? this.state.disabledPayment : this.props.openDisputeO}>
                                        Pay Rent
                                    </Button>
                                </Form.Field>

                                <Message error header="Oops!" content={this.state.errorMessagePayment}/>
                                <Message success header="Success!" content={this.state.successMessagePayment}/>
                            </Form>
                        </Grid.Row>

                        {this.showRatingModal()}

                        {this.state.inputRatingButton && <Grid.Row centered>
                            <Button color='yellow' loading={this.state.loadingRating} onClick={() => this.setState({ showRatingModal: true })}>
                                <Icon name='star' />
                                Input Rating
                            </Button>
                        </Grid.Row>}

                        <Grid.Row centered>
                            {this.state.successRating && <Message color='yellow' size='large'><Icon name='checkmark'/>{this.state.successRating}</Message>}
                            {this.state.errorRating && <Message color='red' size='large'><Icon name='warning sign'/>{this.state.errorRating}</Message>}
                        </Grid.Row>
                    </React.Fragment>
                );
            }
        }else if(inState === 'DELETED'){
            return(
                <Grid.Row centered>
                    <Message color='red' compact
                        icon="remove circle"
                        header="This item is no longer available"
                    />
                </Grid.Row>
            );
        }
    }

    showRatingModal(){

        return(
            <Modal
                size="small"
                open={this.state.showRatingModal}
                onClose={() => this.setState({ showRatingModal: false })}
            >
                <Modal.Header>Rate Item</Modal.Header>
                <Modal.Content>
                    <Form>
                        <h4>{this.props.productName}</h4>
                        <Divider />
                        <Rating 
                            onRate={(e, {rating} ) => this.setState({rating})} 
                            icon='star' 
                            defaultRating={0} 
                            maxRating={5} 
                            size='massive'/>
                        <Divider />
                        <Form.TextArea 
                            label='Comments' 
                            placeholder='Tell us more about the item'
                            onChange={event => this.setState({ rateDescription: event.target.value })} 
                        />
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button positive loading={this.state.loadingRating} onClick={(e) => this.onSubmitRating(e)}>
                        <Icon name='upload' />
                        Submit
                    </Button>
                </Modal.Actions>
                {this.state.errorRating && <Message attached='bottom' color='red'>
                    <Icon name='warning sign'/>
                    {this.state.errorRating}
                </Message>}
            </Modal>
        );
    }

    showSummary() {
        return(
            <Message compact
                header="Here is the summary of the rent"
                content={"Payable : ~" + parseFloat(this.props.totalFee).toFixed(4) + " ETH"}
            />  
        );
    }

    showReclaimOption() {
        let isChecked = false;
        return(
            <Modal
                size="small"
                open={this.state.showReclaimOption}
                onClose={() => this.setState({ showReclaimOption: false })}
            >
                <Modal.Header>Confirm Reclaim Item</Modal.Header>
                <Modal.Content>
                    <p>
                        By clicking the 'Submit' button, I confirm that I have received the item from 
                        the borrower. Any dispute regarding the returned item will be processed by selecting
                        the checkbox below.
                    </p>
                    <Checkbox label='I want to open a dispute' onChange={(e, {checked}) => {isChecked = checked}}/>
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={() => this.setState({ showReclaimOption: false })}>
                        <Icon name='cancel' />
                        Cancel
                    </Button>
                    <Button positive onClick={(e) => this.onSubmitPayment(e, isChecked)}>
                        <Icon name='upload' />
                        Submit
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }

    renderImage(){
        const { image } = this.props;

        if(parseInt(image) == 0) {
            return(
                <Segment placeholder>
                    <Header icon>
                    <Icon name='images outline' />
                        No photos for this item.
                    </Header>
                </Segment>
            );
        } else {
            return(
                <Segment padded placeholder>
                    <Image 
                        centered
                        size='medium'
                        src={image}
                    />
                </Segment>   
            );
        }
    }

    showFilesQuestion () {
        let {fileNamesQuestion, fileHashesQuestion} = this.props;

        if (fileNamesQuestion.length == 0) {
            return(
                <Segment placeholder>
                    <Header icon>
                    <Icon name='images outline' />
                        No files are uploaded for this question.
                    </Header>
                </Segment> 
            );
        } else {
            return(
                <Segment placeholder>
                    <center>
                        {fileNamesQuestion.map((fileName, index1) => 
                            <div style={{marginBottom: '10px'}}>
                                <Label as='a' size='big' href={"https://gateway.ipfs.io/ipfs/"+fileHashesQuestion[index1]}>
                                    <Icon name='download' />
                                    {fileName}
                                </Label>
                            </div>
                        )}   
                    </center>
                </Segment> 
            );
        }
    }

    showTitle() {
        const {productName} = this.props;
        return (
                <Divider horizontal>
                    <Header as='h2'>
                        <Icon name='tag' />
                        {productName}
                    </Header>
                </Divider>
        );
    }

    showQuestion() {
        const {
            description,
            //deposit,
            maxDuration
        } = this.props;

        let duration = (parseFloat(maxDuration) / 60 / 60).toFixed(2).toString();
        const publishTime = moment.unix(this.props.time[0]).format('dddd, Do MMMM YYYY, h:mm:ss a');
        const showRating = (this.state.submitRate ? this.state.totalRating : this.props.initialTotalRating)/1;
        const showDeposit = (this.state.submitRate ? this.state.totalDeposit: this.props.initialDeposit)*1000000000000000000;
        console.log(showDeposit);
        console.log(showRating);
        return (
            <React.Fragment>
                <Table definition>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell width={2}>Question</Table.Cell>
                            <Table.Cell style={{fontSize: '20px', lineHeight: '1.5'}}>
                                {description}
                            </Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Deposit (ETH)</Table.Cell>
                            <Table.Cell style={{fontSize: '20px'}}>{showDeposit}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Publish Time</Table.Cell>
                            <Table.Cell style={{fontSize: '20px'}}>{publishTime}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>Duration (hours)</Table.Cell>
                            <Table.Cell style={{fontSize: '20px'}}>
                                <span style={{verticalAlign: 'middle', lineHeight: '33px'}}>
                                    {duration}
                                </span>
                                <Button style={{float: 'right', verticalAlign: 'middle'}}  
                                    icon='clock'
                                    primary
                                />
                               
                            </Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell><span onClick={() => this.setState({ popUpRatingQuestion: true })} style={{cursor: 'pointer', color: 'blue'}}>Vote</span></Table.Cell>
                            <Table.Cell><Rating icon='star' size='huge' rating={showRating} maxRating={5} disabled /></Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </React.Fragment>
        );
    }

    Comments = (elmFiles) => {

        //console.log("elmFiles:", elmFiles);

        //let {replyList, fileHashesList, answererList, answerTimeList} = this.props;
        //const {answererList} = this.state;
        const {answerList, replyText_arr} = this.state;
        console.log("answererList in Comments: ", answerList);
        
        // let reply_arr = this.convertToReplyText(answerList);
        // console.log("reply_arr: ", reply_arr);

        let elmComments = null;
        if (answerList.length !== 0) {
            elmComments = answerList.map((item, index) => 
                <Comment>
                    <Comment.Avatar src={this.props.avatarListIcon[index]} style={{backgroundColor: 'crimson'}} />
                    <Comment.Content>
                        {/* <Comment.Author as='a'>{item.answerer}</Comment.Author> */}
                        { <Comment.Author as='a'>{this.props.avatarListName[index]}</Comment.Author> }
                        <Comment.Metadata>
                            <div>
                                {moment.unix(item.answerTime).format('dddd, Do MMMM YYYY, h:mm:ss a')}
                            </div>
                        </Comment.Metadata>
                        <Comment.Text>
                            {replyText_arr[index]}
                        </Comment.Text>
                        <Comment.Actions>
                            <Comment.Action>Reply</Comment.Action>                                               
                            <Comment.Action><span onClick={() => this.setState({ 
                                                                                popUpRatingAnswer: true,
                                                                                currentIndexAnswer: index
                                                                                })}>Vote</span></Comment.Action>
                            <Comment.Action><Rating icon='star' 
                                                rating={((this.state.submitRateAnswer&&(this.state.currentIndexAnswer==index))? this.state.totalRatingAnswer: this.props.ratingAnswerList[index])/1}
                                                maxRating={5} disabled /></Comment.Action>
                            {item.fileNames.map((fileName, index1) => 
                                <Label as='a' href={"https://gateway.ipfs.io/ipfs/"+item.fileHashes[index1]}>
                                    <Icon name='download' />
                                    {fileName}
                                </Label>
                            )}    
                        </Comment.Actions>
                    </Comment.Content>
                </Comment>
            );
        } 
        
        console.log(this.state.currentIndexAnswer);
        console.log(this.state.ratingAnswer);
        return (
        <Container>
        <Header as='h3' dividing>
            Comments
        </Header>
        <Comment.Group>
      
          <Comment>
            <Comment.Avatar src={this.props.avatarSrc} style={{backgroundColor: 'crimson'}} />
            <Comment.Content>
              <Comment.Author as='a'>{this.props.avatarName}</Comment.Author>
              <Comment.Metadata>
                <div>Today at 5:42PM</div>
              </Comment.Metadata>
              <Comment.Text>How artistic!</Comment.Text>
              <Comment.Actions>
                <Comment.Action><span onClick={() => this.setState({ popUpReply: true })}>Reply</span></Comment.Action>
                <Comment.Action><span onClick={() => this.setState({ popUpRating: true })}>Vote</span></Comment.Action>
                <Comment.Action><Rating icon='star' defaultRating={3} maxRating={5} disabled /></Comment.Action>
                <Label as='a'>
                        <Icon name='download' onClick={() => this.downloadFile(item)} />
                        Download
                </Label>
              </Comment.Actions>
            </Comment.Content>
          </Comment>
      
          <Comment>
            <Comment.Avatar src='' />
            <Comment.Content>
              <Comment.Author as='a'>Elliot Fu</Comment.Author>
              <Comment.Metadata>
                <div>Yesterday at 12:30AM</div>
              </Comment.Metadata>
              <Comment.Text>
                <p>This has been very useful for my research. Thanks as well!
                a a a a a a a a a a a a a a a a a a a a a
                a a a a a a a a a a a a a a a a a a a a a
                a a a a a a a a a a a a a a a a a a a a a
                a a a a a a a a a a a a a a a a a a a a a
                </p>
              </Comment.Text>
              <Comment.Actions>
                <Comment.Action>Reply</Comment.Action>
              </Comment.Actions>
            </Comment.Content>
            <Comment.Group>
              <Comment>
                <Comment.Avatar src='' />
                <Comment.Content>
                  <Comment.Author as='a'>Jenny Hess</Comment.Author>
                  <Comment.Metadata>
                    <div>Just now</div>
                  </Comment.Metadata>
                  <Comment.Text>Elliot you are always so right :)</Comment.Text>
                  <Comment.Actions>
                    <Comment.Action><span onClick={() => this.setState({ popUpReply: !this.state.popUpReply })}>Reply</span></Comment.Action>
                  </Comment.Actions>
                </Comment.Content>
              </Comment>
              {this.state.popUpReply && <Form reply>
                <Form.TextArea />
                    <Button icon='file' />
                    <Button content='Add Reply' labelPosition='left' icon='edit' primary />
              </Form>}
            </Comment.Group>
          </Comment>
      
          <Comment>
            <Comment.Avatar src='' />
            <Comment.Content>
              <Comment.Author as='a'>Joe Henderson</Comment.Author>
              <Comment.Metadata>
                <div>5 days ago</div>
              </Comment.Metadata>
              <Comment.Text>Dude, this is awesome. Thanks so much</Comment.Text>
              <Comment.Actions>
                <Comment.Action>Reply</Comment.Action>
              </Comment.Actions>
            </Comment.Content>
          </Comment>
      
          {elmComments}

        </Comment.Group>
        
        <Form reply>
            <Form.TextArea 
                placeholder="Enter Reply"
                value={this.state.reply}
                onChange={event => this.setState({ reply: event.target.value })}>
                    <div>
                        <Label as='a'>
                            Tag
                            <Icon name='delete' />
                        </Label>
                    </div>
            </Form.TextArea>
            <center>
                <div style={{marginBottom: '10px'}}>
                    {elmFiles}
                </div>

                <input 
                    style={{ display: 'none' }} 
                    type='file' 
                    onChange={() => this.onFileSelected()}
                    ref={fileInput => this.fileInput = fileInput}/>
                <Button icon='file' onClick={() => this.fileInput.click()}></Button>
                <Button content='Add Reply' labelPosition='left' icon='edit' primary 
                    onClick={(e) => this.onSubmitReply(e)} />
            </center>
        </Form>
        <Modal
            size="tiny"
            open={this.state.popUpRatingAnswer}
            onClose={() => this.setState({ popUpRatingAnswer: false })}
            style={{textAlign: 'center'}}
        >
            <Modal.Header>Rate this answer</Modal.Header>
            <Modal.Content>
                <span textAlign='center'><Rating onRate={(e, {rating} ) => this.setState({ratingAnswer: rating})} maxRating={5} icon='star' size='massive' /></span>
            </Modal.Content>
            <Modal.Actions>
                <Button negative onClick={() => this.setState({ popUpRatingAnswer: false })}>
                    <Icon name='remove' />
                    Cancel
                </Button>
                <Button positive onClick={(e) => this.onSubmitRatingAnswer(e,this.state.currentIndexAnswer)} loading={this.state.loadingRatingAnswer} disabled={this.state.disabledRatingAnswer}>
                    <Icon name='checkmark' />
                    Submit
                </Button>
            </Modal.Actions>
                </Modal>
        

        <Modal
            size="tiny"
            open={this.state.popUpRatingQuestion}
            onClose={() => this.setState({ popUpRatingQuestion: false })}
            style={{textAlign: 'center'}}
        >
            <Modal.Header>Rate this question</Modal.Header>
            <Modal.Content>
                <span textAlign='center'><Rating onRate={(e, {rating} ) => this.setState({rating})} maxRating={5} icon='star' size='massive' /></span>
            </Modal.Content>
            <Modal.Actions>
                <Button negative onClick={() => this.setState({ popUpRatingQuestion: false })}>
                    <Icon name='remove' />
                    Cancel
                </Button>
                <Button positive onClick={(e) => this.onSubmitRatingQuestion(e)}  loading={this.state.loadingRatingQuestion} disabled={this.state.disabledRatingQuestion}>
                    <Icon name='checkmark' />
                    Submit
                </Button>
            </Modal.Actions>
                </Modal>
        </Container>
      );
    }

    onFileRemoved = (file) => {
        var i = 0;
        let {files_array, fileHashes_array, fileNames_array} = this.state;
        console.log('file: ', file);
        for (i = 0 ; i < files_array.length ; i++) {
            if (file === files_array[i]) {
                files_array.splice(i, 1);
                fileNames_array.splice(i, 1);
                fileHashes_array.splice(i, 1);
                break;
            } 
        }

        this.setState({ 
            files_array: files_array,
            fileNames_array: fileNames_array,
            fileHashes_array: fileHashes_array
        });
        console.log('files_array', files_array);
        console.log('fileNames_array', fileNames_array);
        console.log("fileHashes_array: ", fileHashes_array);
    }

    onFileSelected = async () => {

        const reader = new FileReader();

        const file = this.fileInput.files[0]; 
        
        if (file instanceof Blob ) {
            console.log(file);

            let {files_array, fileNames_array, fileHashes_array} = this.state;
            files_array.push(file);
            fileNames_array.push(file.name);
            this.setState({ 
                files_array: files_array, 
                fileNames_array: fileNames_array
            });

            console.log("fileNames_array: ", fileNames_array);

            reader.onloadend = async () => {
                await this.setState({
                    fileUrl: reader.result,
                    loadingFile: true,
                    buffer: Buffer.from(reader.result)
                });          
                console.log("this.state.buffer: ", this.state.buffer);
                const fileHash = this.state.buffer ? (await getIpfsHash(file)) : '0';
            
                fileHashes_array.push(fileHash);
                this.setState({ fileHashes_array: fileHashes_array });

                this.setState({ loadingFile: false });
                console.log("fileHashes_array: ", fileHashes_array);
            }

            reader.readAsDataURL(file);
        }
    }

    onSubmitReply = async (event) => {
        event.preventDefault();

        const { productName, description, rentalFee, deposit, maxDuration } = this.state;
        let {fileHashes_array, reply, fileNames_array} = this.state;

        this.setState({ loading: true, errorMessage: '' });

        console.log(this.state.reply);

        try{
            const replyBuf = Buffer.from(reply, 'utf8');
            const replyHash = await getIpfsHash(replyBuf);
            const accounts = await web3.eth.getAccounts();
            await factory.methods
                .createAnswer(this.props.address,
                                replyHash.substring(2),
                                fileHashes_array,
                                fileNames_array)
                .send({      
                    from: accounts[0]
                });

            console.log("Done add reply!!!");
            const rent = Rental(this.props.address);
            const answerList = await rent.methods.getAnswerList().call();
            this.setState({ answerList: answerList});
            
            this.setState({replyText_arr: []});
            let {replyText_arr} = this.state;
            var i;
            for (i = 0 ; i < answerList.length ; i++) {
                let replyText = await getString('Qm'+answerList[i].replyHash)
                console.log("await getString('Qm'+item.replyHash)", replyText);
                replyText_arr.push(replyText);
            }
            this.setState({ replyText_arr: replyText_arr });

            console.log("this.state.replyText_arr: ", this.state.replyText_arr);
            
            console.log("this.state.answerList: ", this.state.answerList);

            this.setState({
                reply: '',
                files_array: [],
                fileNames_array: []
            });
        
        } catch (err) {
            this.setState({ errorMessage: err.message });
            console.log('error happennnn');
            console.log('errorMessage: ', err.message);
        }
        this.setState({ loading: false });
    }

    render() {
        const showSummary = this.state.isRenter && this.props.inState === "AWAITPAYMENT";
        const createDispute = this.state.isRenter && this.props.inState === "RENTED" && !this.props.openDispute;
        const showTimeDetails = this.props.inState === "RENTED" || this.props.inState === "AWAITPAYMENT";
        const borrowedSince = moment.unix(this.props.time[0]).format('dddd, Do MMMM YYYY, h:mm:ss a');
        const overdueTime = moment.unix(parseInt(this.props.time[0]) + parseInt(this.props.time[2])).format('dddd, Do MMMM YYYY, h:mm:ss a');

        let {files_array} = this.state;
        let elmFiles = null;
        if (files_array !== null) {
            elmFiles = files_array.map((item, index) =>
                <Label as='a' key={index} >
                    {item.name}
                    <Icon name='delete' 
                    onClick={() => this.onFileRemoved(item)} />
                </Label>
            );
        }

        console.log('render()');

        return(
            <Layout>
                {/* {createDispute && <Button primary floated='right' onClick={() => Router.pushRoute(`/rents/${this.props.address}/dispute/new`)}>Create Dispute</Button>}
                {this.props.openDispute && 
                <Button floated='right' color='red' onClick={() => Router.pushRoute(`/rents/${this.props.address}/dispute`)}>
                        <Icon name='warning circle' />
                        Ongoing Dispute
                </Button>}

                <h3 style={{marginTop: 15}}>Product Details</h3>

                {showTimeDetails && <Grid>
                    <Grid.Row columns='2' verticalAlign='middle'>
                        <Grid.Column>
                            Borrowed since {borrowedSince}
                        </Grid.Column>
                        <Grid.Column textAlign='right'>
                            <Message color='yellow' compact size='tiny'
                                header={'Overdue Time: ' + overdueTime}
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>}

                <Divider hidden/>

                {this.renderImage()}

                <Divider hidden/>

                <Grid>
                    <Grid.Row>
                        {this.renderCards()}
                    </Grid.Row>

                    <Divider hidden/>

                    {showSummary && <Grid.Row centered>
                        {this.showSummary()}
                    </Grid.Row>}

                    <Divider hidden/>

                    {this.renderOptions()}

                </Grid>

                <Divider hidden/> */} 
                

                {this.showTitle()}

                <Divider hidden/>

                {this.showFilesQuestion()}

                <Divider hidden/>

                {this.showQuestion()}

                <Divider hidden/>
                <Divider hidden/>

                {this.Comments(elmFiles)}

                <Divider hidden/>
            </Layout> 
        );
    }
}

export default RentalShow;
