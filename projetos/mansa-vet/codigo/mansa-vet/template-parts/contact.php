<?php $sent = isset( $_GET['sent'] ) ? sanitize_key( $_GET['sent'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification ?>
<section class="section section-forest" id="contato">
	<div class="wrap contact-grid">
		<div>
			<p class="eyebrow">Contato</p>
			<h2>Vamos marcar uma conversa?</h2>
			<p class="lead">Conte um pouco sobre o seu bichinho e a gente retorna no mesmo dia útil para confirmar o horário.</p>
			<ul class="contact-list">
				<li><span>Telefone</span><strong><?php echo esc_html( mansa_opt( 'phone' ) ); ?></strong></li>
				<li><span>Endereço</span><strong><?php echo esc_html( mansa_opt( 'address' ) ); ?></strong></li>
				<li><span>Horário</span><strong><?php echo esc_html( mansa_opt( 'hours' ) ); ?></strong></li>
			</ul>
		</div>
		<form class="form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<?php if ( 'ok' === $sent ) : ?><p class="notice ok" role="status">Pedido recebido! Retornamos em breve.</p><?php endif; ?>
			<?php if ( 'error' === $sent ) : ?><p class="notice err" role="alert">Não foi possível enviar. Confira nome e telefone.</p><?php endif; ?>
			<input type="hidden" name="action" value="mansa_contact">
			<?php wp_nonce_field( 'mansa_contact' ); ?>
			<div class="hp" aria-hidden="true"><label>Site <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
			<label>Seu nome <input type="text" name="nome" required autocomplete="name"></label>
			<div class="two">
				<label>Telefone <input type="tel" name="telefone" required autocomplete="tel"></label>
				<label>Nome do pet <input type="text" name="pet"></label>
			</div>
			<label>Como podemos ajudar? <textarea name="mensagem" rows="4"></textarea></label>
			<button class="btn" type="submit">Pedir consulta</button>
		</form>
	</div>
</section>
